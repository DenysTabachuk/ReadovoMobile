import { Injectable } from '@nestjs/common';

import { ApiException } from '../common/errors/api-exception';

import { dateOnlyToDate, dateToDateOnly } from '../common/database/date-only';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { type CompleteStreakActivityDto } from './dto';
import { STREAK_ERRORS } from './streak-errors';
import {
  mapStreakHistory,
  mapStreakProfile,
  serializeBrokenStreakInfo,
} from './streak.persistence';
import {
  type BrokenStreakInfo,
  type CalendarDayStatus,
  type CompleteStreakActivityResponse,
  type StreakAchievement,
  type StreakAchievementMilestone,
  type StreakCalendarDay,
  type StreakCalendarMonthResponse,
  type StreakClaimedAchievementRecord,
  type StreakDayStatus,
  type StreakHistoryRecord,
  type StreakProfileRecord,
  type StreakState,
  type StreakTodayStatus,
} from './types';

const RESTORE_PRICE = 100;
const FREEZE_TOKEN_PRICE = 100;
const MAX_FREEZE_TOKENS = 3;
const MAX_FREEZE_DAYS_PER_BREAK = 3;
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
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<StreakState> {
    const profile = await this.ensureProfile(userId);
    const serverNow = new Date();
    const localToday = this.getLocalDateKey(serverNow, profile.timezone);

    const reconciled = await this.reconcileMissingDays(
      userId,
      profile,
      localToday,
    );
    let refreshedProfile = reconciled ?? profile;

    if (refreshedProfile.brokenStreakInfo?.canRestore === false) {
      await this.rebuildProfileFromHistory(
        userId,
        refreshedProfile.timezone,
        localToday,
      );
      refreshedProfile = await this.ensureProfile(userId);
    }

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
    const profile = await this.ensureProfile(userId);
    const serverNow = new Date();
    const localToday = this.getLocalDateKey(serverNow, profile.timezone);
    const currentYear = Number.parseInt(localToday.slice(0, 4), 10);
    const currentMonth = Number.parseInt(localToday.slice(5, 7), 10);

    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      throw new ApiException(STREAK_ERRORS.CALENDAR_MONTH_UNAVAILABLE);
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

    const historyRows = await this.prisma.userStreakHistory.findMany({
      where: {
        activityDate: {
          gte: dateOnlyToDate(monthStart),
          lte: dateOnlyToDate(monthEnd),
        },
        userId,
      },
    });

    const historyMap = new Map(
      historyRows.map((row) => [dateToDateOnly(row.activityDate), row.status]),
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
    const profile = await this.ensureProfile(userId, payload.timezone);
    const serverNow = new Date();
    const localToday = this.getLocalDateKey(serverNow, profile.timezone);

    let working =
      (await this.reconcileMissingDays(userId, profile, localToday)) ?? profile;

    const todayRow = await this.getHistoryDay(userId, localToday);

    if (todayRow?.status !== 'completed') {
      const previousStreak = working.currentStreak;
      const nextStreak = previousStreak > 0 ? previousStreak + 1 : 1;

      const activityDate = dateOnlyToDate(localToday);
      await this.prisma.userStreakHistory.upsert({
        create: { activityDate, status: 'completed', userId },
        update: { status: 'completed' },
        where: { userId_activityDate: { activityDate, userId } },
      });

      await this.prisma.userStreakProfile.update({
        data: {
          currentStreak: nextStreak,
          lastActivityDate: activityDate,
          longestStreak: Math.max(working.longestStreak, nextStreak),
          updatedAt: new Date(),
        },
        where: { userId },
      });

      working = {
        ...working,
        currentStreak: nextStreak,
        lastActivityDate: localToday,
        longestStreak: Math.max(working.longestStreak, nextStreak),
      };

      await this.unlockMilestones(userId, nextStreak);
    }

    return {
      streak: await this.getProfile(userId),
    };
  }

  async restore(userId: string, price: number): Promise<StreakState> {
    if (price !== RESTORE_PRICE) {
      throw new ApiException(STREAK_ERRORS.RESTORE_PRICE_INVALID);
    }

    const profile = await this.ensureProfile(userId);
    const broken = profile.brokenStreakInfo;
    const localToday = this.getLocalDateKey(new Date(), profile.timezone);

    if (!broken?.canRestore) {
      throw new ApiException(STREAK_ERRORS.RESTORE_UNAVAILABLE);
    }

    const balance = await this.getUserBalance(userId);

    if (balance.balance < RESTORE_PRICE) {
      throw new ApiException(STREAK_ERRORS.NOT_ENOUGH_COINS);
    }

    await this.prisma.user.update({
      data: { balance: { decrement: RESTORE_PRICE } },
      where: { id: userId },
    });

    const brokenAt = dateOnlyToDate(broken.brokenAt);
    await this.prisma.userStreakHistory.upsert({
      create: { activityDate: brokenAt, status: 'restored', userId },
      update: { status: 'restored' },
      where: { userId_activityDate: { activityDate: brokenAt, userId } },
    });

    const rebuiltCurrentStreak = await this.rebuildProfileFromHistory(
      userId,
      profile.timezone,
      localToday,
    );
    await this.unlockMilestones(userId, rebuiltCurrentStreak);

    return this.getProfile(userId);
  }

  async applyFreeze(userId: string, date: string): Promise<StreakState> {
    const profile = await this.ensureProfile(userId);
    const localToday = this.getLocalDateKey(new Date(), profile.timezone);

    await this.reconcileMissingDays(userId, profile, localToday);

    const refreshedProfile = await this.ensureProfile(userId);

    if (refreshedProfile.freezeTokens <= 0) {
      throw new ApiException(STREAK_ERRORS.NO_FREEZE_TOKENS);
    }

    const day = await this.getHistoryDay(userId, date);

    if (
      day?.status === 'completed' ||
      day?.status === 'frozen' ||
      day?.status === 'restored'
    ) {
      throw new ApiException(STREAK_ERRORS.DAY_ALREADY_PROTECTED);
    }

    if (day?.status !== 'missed') {
      throw new ApiException(STREAK_ERRORS.FREEZE_ONLY_MISSED_DAY);
    }

    if (await this.hasReachedFreezeLimitForBreak(userId, date)) {
      throw new ApiException(STREAK_ERRORS.FREEZE_DAY_LIMIT_REACHED);
    }

    await this.prisma.userStreakHistory.updateMany({
      data: { status: 'frozen' },
      where: { activityDate: dateOnlyToDate(date), userId },
    });

    await this.prisma.userStreakProfile.update({
      data: { freezeTokens: { decrement: 1 }, updatedAt: new Date() },
      where: { userId },
    });

    const rebuiltCurrentStreak = await this.rebuildProfileFromHistory(
      userId,
      refreshedProfile.timezone,
      localToday,
    );
    await this.unlockMilestones(userId, rebuiltCurrentStreak);

    return this.getProfile(userId);
  }

  async purchaseFreezeToken(
    userId: string,
    price: number,
  ): Promise<StreakState> {
    if (price !== FREEZE_TOKEN_PRICE) {
      throw new ApiException(STREAK_ERRORS.FREEZE_TOKEN_PRICE_INVALID);
    }

    const profile = await this.ensureProfile(userId);

    if (profile.freezeTokens >= MAX_FREEZE_TOKENS) {
      throw new ApiException(STREAK_ERRORS.FREEZE_TOKEN_LIMIT_REACHED);
    }

    const balance = await this.getUserBalance(userId);

    if (balance.balance < FREEZE_TOKEN_PRICE) {
      throw new ApiException(STREAK_ERRORS.NOT_ENOUGH_COINS);
    }

    await this.prisma.user.update({
      data: { balance: { decrement: FREEZE_TOKEN_PRICE } },
      where: { id: userId },
    });

    await this.prisma.userStreakProfile.update({
      data: {
        freezeTokens: Math.min(profile.freezeTokens + 1, MAX_FREEZE_TOKENS),
        updatedAt: new Date(),
      },
      where: { userId },
    });

    return this.getProfile(userId);
  }

  private async ensureProfile(
    userId: string,
    timezone?: string,
  ): Promise<StreakProfileRecord> {
    const user = await this.prisma.user.findUnique({
      select: { id: true },
      where: { id: userId },
    });

    if (!user) {
      throw new ApiException(STREAK_ERRORS.USER_NOT_FOUND);
    }

    // The DTO validates supplied zones. Optional null/absence must not overwrite
    // an existing profile; a new profile starts in UTC.
    const profile = await this.prisma.userStreakProfile.upsert({
      create: { timezone: timezone ?? 'UTC', userId },
      update: timezone ? { timezone } : {},
      where: { userId },
    });

    return mapStreakProfile(profile);
  }

  private async getHistoryDay(
    userId: string,
    date: string,
  ): Promise<StreakHistoryRecord | null> {
    const row = await this.prisma.userStreakHistory.findUnique({
      where: {
        userId_activityDate: {
          activityDate: dateOnlyToDate(date),
          userId,
        },
      },
    });

    return row ? mapStreakHistory(row) : null;
  }

  private async reconcileMissingDays(
    userId: string,
    profile: StreakProfileRecord,
    localToday: string,
  ): Promise<StreakProfileRecord | null> {
    if (!profile.lastActivityDate) {
      return null;
    }

    const missingDays = this.getDatesBetween(
      profile.lastActivityDate,
      localToday,
    );

    if (missingDays.length === 0) {
      return null;
    }

    let currentStreak = profile.currentStreak;
    let brokenInfo = profile.brokenStreakInfo;

    for (const day of missingDays) {
      const existing = await this.getHistoryDay(userId, day);

      if (existing?.status === 'frozen' || existing?.status === 'restored') {
        continue;
      }

      if (existing?.status === 'missed') {
        currentStreak = 0;
        brokenInfo = brokenInfo ?? {
          brokenAt: day,
          canRestore: true,
          previousStreak: profile.currentStreak,
          restorePrice: RESTORE_PRICE,
        };
        continue;
      }

      if (existing?.status === 'completed') {
        continue;
      }

      const activityDate = dateOnlyToDate(day);
      await this.prisma.userStreakHistory.upsert({
        create: { activityDate, status: 'missed', userId },
        update: {},
        where: { userId_activityDate: { activityDate, userId } },
      });

      brokenInfo = {
        brokenAt: day,
        canRestore: true,
        previousStreak: currentStreak,
        restorePrice: RESTORE_PRICE,
      };
      currentStreak = 0;
    }

    await this.prisma.userStreakProfile.update({
      data: {
        brokenStreakInfo:
          serializeBrokenStreakInfo(brokenInfo) ?? Prisma.DbNull,
        currentStreak,
        updatedAt: new Date(),
      },
      where: { userId },
    });

    return {
      ...profile,
      brokenStreakInfo: brokenInfo,
      currentStreak,
    };
  }

  private async rebuildProfileFromHistory(
    userId: string,
    timezone: string,
    localToday: string,
  ): Promise<number> {
    const history = (
      await this.prisma.userStreakHistory.findMany({
        orderBy: { activityDate: 'asc' },
        where: { userId },
      })
    ).map(mapStreakHistory);

    const protectedStatuses = new Set<StreakDayStatus>([
      'completed',
      'frozen',
      'restored',
    ]);
    let currentStreak = 0;
    let longestStreak = 0;
    let lastActivityDate: string | null = null;
    let brokenInfo: BrokenStreakInfo | null = null;

    for (const day of history) {
      if (day.activityDate >= localToday) {
        continue;
      }

      if (protectedStatuses.has(day.status)) {
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
        lastActivityDate = day.activityDate;
        brokenInfo = null;
        continue;
      }

      if (day.status === 'missed') {
        brokenInfo = {
          brokenAt: day.activityDate,
          canRestore: true,
          previousStreak: currentStreak,
          restorePrice: RESTORE_PRICE,
        };
        currentStreak = 0;
      }
    }

    const todayRow = history.find((day) => day.activityDate === localToday);

    if (todayRow && protectedStatuses.has(todayRow.status)) {
      currentStreak += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
      lastActivityDate = todayRow.activityDate;
      brokenInfo = null;
    }

    await this.prisma.userStreakProfile.update({
      data: {
        brokenStreakInfo:
          serializeBrokenStreakInfo(brokenInfo) ?? Prisma.DbNull,
        currentStreak,
        lastActivityDate: lastActivityDate
          ? dateOnlyToDate(lastActivityDate)
          : null,
        timezone,
        updatedAt: new Date(),
      },
      where: { userId },
    });
    await this.prisma.userStreakProfile.updateMany({
      data: { longestStreak },
      where: { longestStreak: { lt: longestStreak }, userId },
    });

    return currentStreak;
  }

  private async unlockMilestones(
    userId: string,
    currentStreak: number,
  ): Promise<void> {
    const eligibleMilestones = STREAK_MILESTONES.filter(
      (milestone) => currentStreak >= milestone.milestone,
    );

    if (eligibleMilestones.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (transaction) => {
      const inserted =
        await transaction.userStreakAchievement.createManyAndReturn({
          data: eligibleMilestones.map((milestone) => ({
            milestone: milestone.milestone,
            rewardCoins: milestone.rewardCoins,
            userId,
          })),
          select: { rewardCoins: true },
          skipDuplicates: true,
        });
      const totalReward = inserted.reduce(
        (total, milestone) => total + milestone.rewardCoins,
        0,
      );

      if (totalReward > 0) {
        await transaction.user.update({
          data: { balance: { increment: totalReward } },
          where: { id: userId },
        });
      }
    });
  }

  private async getRecentHistory(
    userId: string,
  ): Promise<StreakHistoryRecord[]> {
    const rows = await this.prisma.userStreakHistory.findMany({
      orderBy: { activityDate: 'desc' },
      take: 90,
      where: { userId },
    });

    return rows.map(mapStreakHistory);
  }

  private async getClaimedAchievements(
    userId: string,
  ): Promise<StreakClaimedAchievementRecord[]> {
    const rows = await this.prisma.userStreakAchievement.findMany({
      where: { userId },
    });

    return rows.map((row) => ({
      claimedAt: row.claimedAt,
      milestone: row.milestone,
      rewardCoins: row.rewardCoins,
    }));
  }

  private async getUserBalance(userId: string): Promise<UserBalanceRow> {
    const row = await this.prisma.user.findUnique({
      select: { balance: true },
      where: { id: userId },
    });

    if (!row) {
      throw new ApiException(STREAK_ERRORS.USER_NOT_FOUND);
    }

    return row;
  }

  private toState(
    profile: StreakProfileRecord,
    history: StreakHistoryRecord[],
    claimedRows: StreakClaimedAchievementRecord[],
    coinBalance: number,
    serverNow: Date,
    localToday: string,
  ): StreakState {
    const claimedMap = new Map(claimedRows.map((row) => [row.milestone, row]));

    const claimedStreakAchievements: StreakAchievement[] =
      STREAK_MILESTONES.map((milestone) => {
        const claimed = claimedMap.get(milestone.milestone);

        return {
          claimedAt: claimed?.claimedAt.toISOString() ?? null,
          isUnlocked: Boolean(claimed),
          milestone: milestone.milestone,
          rewardCoins: milestone.rewardCoins,
        };
      });

    const todayHistory = history.find((day) => day.activityDate === localToday);
    const todayStatus = this.resolveTodayStatus(profile, todayHistory?.status);

    const nextMilestone =
      STREAK_MILESTONES.find((item) => item.milestone > profile.currentStreak)
        ?.milestone ?? 100;

    const nextBonusInDays = Math.max(0, nextMilestone - profile.currentStreak);

    return {
      activityHistory: history.map((day) => ({
        date: day.activityDate,
        status: day.status,
      })),
      brokenStreakInfo: profile.brokenStreakInfo,
      claimedStreakAchievements,
      coinBalance,
      currentStreak: profile.currentStreak,
      freezeTokens: profile.freezeTokens,
      lastActivityDate: profile.lastActivityDate,
      longestStreak: profile.longestStreak,
      nextBonusInDays,
      nextMilestone,
      serverNow: serverNow.toISOString(),
      todayStatus,
    };
  }

  private resolveTodayStatus(
    profile: StreakProfileRecord,
    todayHistoryStatus?: StreakDayStatus,
  ): StreakTodayStatus {
    if (todayHistoryStatus) {
      return todayHistoryStatus;
    }

    if (profile.brokenStreakInfo?.canRestore) {
      return 'broken';
    }

    return 'pending';
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

  private async hasReachedFreezeLimitForBreak(
    userId: string,
    date: string,
  ): Promise<boolean> {
    const rows = (
      await this.prisma.userStreakHistory.findMany({
        orderBy: { activityDate: 'asc' },
        where: { userId },
      })
    ).map(mapStreakHistory);
    const index = rows.findIndex((row) => row.activityDate === date);

    if (index < 0) {
      return false;
    }

    let frozenDays = 0;

    for (let cursor = index; cursor >= 0; cursor -= 1) {
      const status = rows[cursor].status;

      if (status === 'completed' || status === 'restored') {
        break;
      }

      if (status === 'frozen') {
        frozenDays += 1;
      }
    }

    for (let cursor = index + 1; cursor < rows.length; cursor += 1) {
      const status = rows[cursor].status;

      if (status === 'completed' || status === 'restored') {
        break;
      }

      if (status === 'frozen') {
        frozenDays += 1;
      }
    }

    return frozenDays >= MAX_FREEZE_DAYS_PER_BREAK;
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
