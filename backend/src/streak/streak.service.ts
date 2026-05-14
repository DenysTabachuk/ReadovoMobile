import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import {
  type CalendarDayStatus,
  type CompleteStreakActivityDto,
  type CompleteStreakActivityResponse,
  type StreakAchievement,
  type StreakAchievementMilestone,
  type StreakCalendarDay,
  type StreakCalendarMonthResponse,
  type StreakClaimedAchievementRow,
  type StreakDayStatus,
  type StreakHistoryRow,
  type StreakProfileRow,
  type StreakState,
  type StreakTodayStatus,
} from './types';

const RESTORE_PRICE = 100;
const STREAK_MILESTONES: readonly {
  milestone: StreakAchievementMilestone;
  rewardCoins: number;
}[] = [
  { milestone: 3, rewardCoins: 30 },
  { milestone: 7, rewardCoins: 70 },
  { milestone: 14, rewardCoins: 150 },
  { milestone: 30, rewardCoins: 400 },
  { milestone: 100, rewardCoins: 1500 },
];

type UserBalanceRow = { balance: number };

@Injectable()
export class StreakService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getProfile(userId: string): Promise<StreakState> {
    const profile = await this.ensureProfile(userId);
    const serverNow = new Date();
    const localToday = this.getLocalDateKey(serverNow, profile.timezone);

    const reconciled = await this.reconcileMissingDays(
      userId,
      profile,
      localToday,
    );
    const refreshedProfile = reconciled ?? profile;

    const [history, claimedRows, balanceRow] = await Promise.all([
      this.getRecentHistory(userId),
      this.getClaimedAchievements(userId),
      this.getUserBalance(userId),
    ]);

    return this.toState(
      refreshedProfile,
      history,
      claimedRows,
      balanceRow.balance,
      serverNow,
      localToday,
    );
  }

  async getCalendarMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<StreakCalendarMonthResponse> {
    if (!Number.isInteger(year) || year < 1970 || year > 2100) {
      throw new BadRequestException('Invalid year.');
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('Invalid month.');
    }

    const profile = await this.ensureProfile(userId);
    const serverNow = new Date();
    const localToday = this.getLocalDateKey(serverNow, profile.timezone);
    const currentYear = Number.parseInt(localToday.slice(0, 4), 10);
    const currentMonth = Number.parseInt(localToday.slice(5, 7), 10);

    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      throw new BadRequestException('Future months are not available.');
    }

    const reconciled = await this.reconcileMissingDays(
      userId,
      profile,
      localToday,
    );
    const workingProfile = reconciled ?? profile;

    const monthStart = this.formatDateKeyUTC(year, month, 1);
    const monthDaysCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const monthEnd = this.formatDateKeyUTC(year, month, monthDaysCount);

    const historyResult = await this.databaseService.query<StreakHistoryRow>(
      `
        SELECT activity_date::text, status
        FROM user_streak_history
        WHERE user_id = $1
          AND activity_date >= $2::date
          AND activity_date <= $3::date
      `,
      [userId, monthStart, monthEnd],
    );

    const historyMap = new Map(
      historyResult.rows.map((row) => [row.activity_date, row.status]),
    );

    const todayDate = new Date(`${localToday}T00:00:00.000Z`);
    const days: StreakCalendarDay[] = [];

    for (let day = 1; day <= monthDaysCount; day += 1) {
      const dateKey = this.formatDateKeyUTC(year, month, day);
      const currentDate = new Date(`${dateKey}T00:00:00.000Z`);
      const storedStatus = historyMap.get(dateKey);

      let status: CalendarDayStatus;

      if (storedStatus) {
        status =
          dateKey === localToday && storedStatus === 'completed'
            ? 'today_completed'
            : storedStatus;
      } else if (dateKey === localToday) {
        status = 'today_pending';
      } else if (currentDate > todayDate) {
        status = 'future';
      } else {
        status = 'neutral';
      }

      days.push({
        date: dateKey,
        dayOfMonth: day,
        status,
      });
    }

    return {
      days,
      month,
      monthLabel: this.getMonthLabel(year, month, workingProfile.timezone),
      serverNow: serverNow.toISOString(),
      timezone: workingProfile.timezone,
      year,
    };
  }

  async completeActivity(
    userId: string,
    payload: CompleteStreakActivityDto,
  ): Promise<CompleteStreakActivityResponse> {
    if (!payload.activityType) {
      throw new BadRequestException('Activity type is required.');
    }

    const profile = await this.ensureProfile(userId, payload.timezone);
    const serverNow = new Date();
    const localToday = this.getLocalDateKey(serverNow, profile.timezone);

    let working =
      (await this.reconcileMissingDays(userId, profile, localToday)) ?? profile;

    const todayRow = await this.getHistoryDay(userId, localToday);

    if (todayRow?.status !== 'completed') {
      const previousStreak = working.current_streak;
      const nextStreak = previousStreak > 0 ? previousStreak + 1 : 1;

      await this.databaseService.query(
        `
          INSERT INTO user_streak_history (user_id, activity_date, status)
          VALUES ($1, $2::date, 'completed')
          ON CONFLICT (user_id, activity_date)
          DO UPDATE SET status = 'completed'
        `,
        [userId, localToday],
      );

      await this.databaseService.query(
        `
          UPDATE user_streak_profiles
          SET current_streak = $2,
              longest_streak = GREATEST(longest_streak, $2),
              last_activity_date = $3::date,
              updated_at = now()
          WHERE user_id = $1
        `,
        [userId, nextStreak, localToday],
      );

      working = {
        ...working,
        current_streak: nextStreak,
        last_activity_date: localToday,
        longest_streak: Math.max(working.longest_streak, nextStreak),
      };

      await this.unlockMilestones(userId, nextStreak);
    }

    return {
      streak: await this.getProfile(userId),
    };
  }

  async restore(userId: string, price: number): Promise<StreakState> {
    if (price !== RESTORE_PRICE) {
      throw new BadRequestException('Invalid restore price.');
    }

    const profile = await this.ensureProfile(userId);
    const broken = profile.broken_streak_info;

    if (!broken?.canRestore) {
      throw new BadRequestException('Restore is not available.');
    }

    const balance = await this.getUserBalance(userId);

    if (balance.balance < RESTORE_PRICE) {
      throw new BadRequestException('Not enough coins.');
    }

    await this.databaseService.query(
      `
        UPDATE users
        SET balance = balance - $2
        WHERE id = $1
      `,
      [userId, RESTORE_PRICE],
    );

    await this.databaseService.query(
      `
        INSERT INTO user_streak_history (user_id, activity_date, status)
        VALUES ($1, $2::date, 'restored')
        ON CONFLICT (user_id, activity_date)
        DO UPDATE SET status = 'restored'
      `,
      [userId, broken.brokenAt],
    );

    await this.databaseService.query(
      `
        UPDATE user_streak_profiles
        SET current_streak = $2,
            longest_streak = GREATEST(longest_streak, $2),
            broken_streak_info = jsonb_set(
              COALESCE(broken_streak_info, '{}'::jsonb),
              '{canRestore}',
              'false'::jsonb,
              true
            ),
            updated_at = now()
        WHERE user_id = $1
      `,
      [userId, broken.previousStreak],
    );

    return this.getProfile(userId);
  }

  private async ensureProfile(
    userId: string,
    timezone?: string,
  ): Promise<StreakProfileRow> {
    const user = await this.databaseService.query<{ id: string }>(
      `SELECT id FROM users WHERE id = $1 LIMIT 1`,
      [userId],
    );

    if (!user.rows[0]) {
      throw new NotFoundException('User not found.');
    }

    const resolvedTimezone = this.resolveTimezone(timezone);

    await this.databaseService.query(
      `
        INSERT INTO user_streak_profiles (user_id, timezone)
        VALUES ($1, COALESCE($2, 'UTC'))
        ON CONFLICT (user_id)
        DO UPDATE SET timezone = COALESCE($2, user_streak_profiles.timezone)
      `,
      [userId, resolvedTimezone ?? null],
    );

    const profileResult = await this.databaseService.query<StreakProfileRow>(
      `
        SELECT
          current_streak,
          longest_streak,
          last_activity_date::text,
          freeze_tokens,
          timezone,
          broken_streak_info
        FROM user_streak_profiles
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    );

    return profileResult.rows[0];
  }

  private async getHistoryDay(
    userId: string,
    date: string,
  ): Promise<StreakHistoryRow | null> {
    const result = await this.databaseService.query<StreakHistoryRow>(
      `
        SELECT activity_date::text, status
        FROM user_streak_history
        WHERE user_id = $1 AND activity_date = $2::date
        LIMIT 1
      `,
      [userId, date],
    );

    return result.rows[0] ?? null;
  }

  private async reconcileMissingDays(
    userId: string,
    profile: StreakProfileRow,
    localToday: string,
  ): Promise<StreakProfileRow | null> {
    if (!profile.last_activity_date) {
      return null;
    }

    const missingDays = this.getDatesBetween(
      profile.last_activity_date,
      localToday,
    );

    if (missingDays.length === 0) {
      return null;
    }

    let freezeTokens = profile.freeze_tokens;
    let currentStreak = profile.current_streak;
    let brokenInfo = profile.broken_streak_info;

    for (const day of missingDays) {
      const existing = await this.getHistoryDay(userId, day);

      if (existing) {
        continue;
      }

      if (freezeTokens > 0) {
        freezeTokens -= 1;
        await this.databaseService.query(
          `
            INSERT INTO user_streak_history (user_id, activity_date, status)
            VALUES ($1, $2::date, 'frozen')
            ON CONFLICT (user_id, activity_date) DO NOTHING
          `,
          [userId, day],
        );
        continue;
      }

      await this.databaseService.query(
        `
          INSERT INTO user_streak_history (user_id, activity_date, status)
          VALUES ($1, $2::date, 'missed')
          ON CONFLICT (user_id, activity_date) DO NOTHING
        `,
        [userId, day],
      );

      brokenInfo = {
        brokenAt: day,
        canRestore: true,
        previousStreak: currentStreak,
        restorePrice: RESTORE_PRICE,
      };
      currentStreak = 0;
    }

    await this.databaseService.query(
      `
        UPDATE user_streak_profiles
        SET freeze_tokens = $2,
            current_streak = $3,
            broken_streak_info = $4,
            updated_at = now()
        WHERE user_id = $1
      `,
      [
        userId,
        freezeTokens,
        currentStreak,
        brokenInfo ? JSON.stringify(brokenInfo) : null,
      ],
    );

    return {
      ...profile,
      broken_streak_info: brokenInfo,
      current_streak: currentStreak,
      freeze_tokens: freezeTokens,
    };
  }

  private async unlockMilestones(
    userId: string,
    currentStreak: number,
  ): Promise<void> {
    for (const milestone of STREAK_MILESTONES) {
      if (currentStreak < milestone.milestone) {
        continue;
      }

      const inserted = await this.databaseService.query<{ milestone: number }>(
        `
          INSERT INTO user_streak_achievements (user_id, milestone, reward_coins)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, milestone) DO NOTHING
          RETURNING milestone
        `,
        [userId, milestone.milestone, milestone.rewardCoins],
      );

      if (inserted.rows[0]) {
        await this.databaseService.query(
          `
            UPDATE users
            SET balance = balance + $2
            WHERE id = $1
          `,
          [userId, milestone.rewardCoins],
        );
      }
    }
  }

  private async getRecentHistory(userId: string): Promise<StreakHistoryRow[]> {
    const result = await this.databaseService.query<StreakHistoryRow>(
      `
        SELECT activity_date::text, status
        FROM user_streak_history
        WHERE user_id = $1
        ORDER BY activity_date DESC
        LIMIT 90
      `,
      [userId],
    );

    return result.rows;
  }

  private async getClaimedAchievements(
    userId: string,
  ): Promise<StreakClaimedAchievementRow[]> {
    const result =
      await this.databaseService.query<StreakClaimedAchievementRow>(
        `
        SELECT milestone, reward_coins, claimed_at
        FROM user_streak_achievements
        WHERE user_id = $1
      `,
        [userId],
      );

    return result.rows;
  }

  private async getUserBalance(userId: string): Promise<UserBalanceRow> {
    const result = await this.databaseService.query<UserBalanceRow>(
      `
        SELECT balance
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId],
    );

    const row = result.rows[0];

    if (!row) {
      throw new NotFoundException('User not found.');
    }

    return row;
  }

  private toState(
    profile: StreakProfileRow,
    history: StreakHistoryRow[],
    claimedRows: StreakClaimedAchievementRow[],
    coinBalance: number,
    serverNow: Date,
    localToday: string,
  ): StreakState {
    const claimedMap = new Map(claimedRows.map((row) => [row.milestone, row]));

    const claimedStreakAchievements: StreakAchievement[] =
      STREAK_MILESTONES.map((milestone) => {
        const claimed = claimedMap.get(milestone.milestone);

        return {
          claimedAt: claimed?.claimed_at?.toISOString() ?? null,
          isUnlocked: Boolean(claimed),
          milestone: milestone.milestone,
          rewardCoins: milestone.rewardCoins,
        };
      });

    const todayHistory = history.find(
      (day) => day.activity_date === localToday,
    );
    const todayStatus = this.resolveTodayStatus(profile, todayHistory?.status);

    const nextMilestone =
      STREAK_MILESTONES.find((item) => item.milestone > profile.current_streak)
        ?.milestone ?? 100;

    const nextBonusInDays = Math.max(0, nextMilestone - profile.current_streak);

    return {
      activityHistory: history.map((day) => ({
        date: day.activity_date,
        status: day.status,
      })),
      brokenStreakInfo: profile.broken_streak_info,
      claimedStreakAchievements,
      coinBalance,
      currentStreak: profile.current_streak,
      freezeTokens: profile.freeze_tokens,
      lastActivityDate: profile.last_activity_date,
      longestStreak: profile.longest_streak,
      nextBonusInDays,
      nextMilestone,
      serverNow: serverNow.toISOString(),
      todayStatus,
    };
  }

  private resolveTodayStatus(
    profile: StreakProfileRow,
    todayHistoryStatus?: StreakDayStatus,
  ): StreakTodayStatus {
    if (todayHistoryStatus) {
      return todayHistoryStatus;
    }

    if (profile.broken_streak_info?.canRestore) {
      return 'broken';
    }

    return 'pending';
  }

  private resolveTimezone(timezone?: string): string | undefined {
    if (!timezone) {
      return undefined;
    }

    try {
      Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
      return timezone;
    } catch {
      return undefined;
    }
  }

  private getLocalDateKey(serverNow: Date, timeZone: string): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return formatter.format(serverNow);
  }

  private getDatesBetween(fromDate: string, toDateExclusive: string): string[] {
    const from = new Date(`${fromDate}T00:00:00.000Z`);
    const to = new Date(`${toDateExclusive}T00:00:00.000Z`);

    const dates: string[] = [];
    const cursor = new Date(from);
    cursor.setUTCDate(cursor.getUTCDate() + 1);

    while (cursor < to) {
      dates.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return dates;
  }

  private formatDateKeyUTC(year: number, month: number, day: number): string {
    return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
  }

  private getMonthLabel(year: number, month: number, timezone: string): string {
    const formatter = new Intl.DateTimeFormat('uk-UA', {
      month: 'long',
      timeZone: timezone,
      year: 'numeric',
    });

    return formatter.format(new Date(Date.UTC(year, month - 1, 1)));
  }
}
