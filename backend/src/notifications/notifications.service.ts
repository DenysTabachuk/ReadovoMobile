import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import type {
  LearningReminderPreferences,
  RegisterPushTokenDto,
  SendTestPushDto,
  UpsertLearningReminderPreferencesDto,
} from './types';

type EligibleUserRow = {
  learning_reminder_time: string;
  timezone: string;
  user_id: string;
};

type PushTokenRow = {
  device_id: string;
  expo_push_token: string;
};

const DEFAULT_LEARNING_REMINDER_TIME = '19:00';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const DISPATCH_WINDOW_MINUTES = 15;

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  onModuleInit(): void {
    setInterval(
      () => {
        void this.dispatchLearningReminders();
      },
      DISPATCH_WINDOW_MINUTES * 60 * 1000,
    );
  }

  async getLearningReminderPreferences(
    userId: string,
  ): Promise<LearningReminderPreferences> {
    await this.ensurePreferencesRow(userId);

    const result = await this.databaseService.query<{
      learning_reminder_time: string;
      learning_reminders_enabled: boolean;
    }>(
      `
        SELECT learning_reminders_enabled, learning_reminder_time
        FROM user_notification_preferences
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    );

    const row = result.rows[0];

    return {
      learningReminderTime: row.learning_reminder_time,
      learningRemindersEnabled: row.learning_reminders_enabled,
    };
  }

  async upsertLearningReminderPreferences(
    userId: string,
    payload: UpsertLearningReminderPreferencesDto,
  ): Promise<LearningReminderPreferences> {
    const reminderTime =
      payload.learningReminderTime ?? DEFAULT_LEARNING_REMINDER_TIME;

    if (!/^\d{2}:\d{2}$/.test(reminderTime)) {
      throw new BadRequestException('Invalid reminder time format.');
    }

    await this.databaseService.query(
      `
        INSERT INTO user_notification_preferences (
          user_id,
          learning_reminders_enabled,
          learning_reminder_time,
          updated_at
        )
        VALUES ($1, $2, $3, now())
        ON CONFLICT (user_id)
        DO UPDATE SET
          learning_reminders_enabled = EXCLUDED.learning_reminders_enabled,
          learning_reminder_time = EXCLUDED.learning_reminder_time,
          updated_at = now()
      `,
      [userId, payload.learningRemindersEnabled, reminderTime],
    );

    return this.getLearningReminderPreferences(userId);
  }

  async registerPushToken(
    userId: string,
    payload: RegisterPushTokenDto,
  ): Promise<void> {
    this.logger.log(
      `registerPushToken start userId=${userId} deviceId=${payload.deviceId} platform=${payload.platform}`,
    );
    if (!payload.deviceId || !payload.expoPushToken) {
      throw new BadRequestException('deviceId and expoPushToken are required.');
    }

    if (!payload.expoPushToken.startsWith('ExponentPushToken[')) {
      throw new BadRequestException('Invalid Expo push token.');
    }

    await this.databaseService.query(
      `
        UPDATE user_push_tokens
        SET is_active = false, updated_at = now()
        WHERE expo_push_token = $1
          AND user_id <> $2
      `,
      [payload.expoPushToken, userId],
    );

    await this.databaseService.query(
      `
        INSERT INTO user_push_tokens (
          user_id,
          device_id,
          expo_push_token,
          platform,
          is_active,
          created_at,
          last_seen_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, true, now(), now(), now())
        ON CONFLICT (user_id, device_id)
        DO UPDATE SET
          expo_push_token = EXCLUDED.expo_push_token,
          platform = EXCLUDED.platform,
          is_active = true,
          last_seen_at = now(),
          updated_at = now()
      `,
      [userId, payload.deviceId, payload.expoPushToken, payload.platform],
    );
    this.logger.log(
      `registerPushToken upsert done userId=${userId} deviceId=${payload.deviceId}`,
    );
  }

  async deactivatePushToken(userId: string, deviceId: string): Promise<void> {
    await this.databaseService.query(
      `
        UPDATE user_push_tokens
        SET is_active = false, updated_at = now()
        WHERE user_id = $1
          AND device_id = $2
      `,
      [userId, deviceId],
    );
  }

  async sendTestPush(userId: string, payload: SendTestPushDto): Promise<{ sentCount: number }> {
    this.logger.log(`sendTestPush start userId=${userId}`);
    const tokens = await this.databaseService.query<PushTokenRow>(
      `
        SELECT device_id, expo_push_token
        FROM user_push_tokens
        WHERE user_id = $1
          AND is_active = true
      `,
      [userId],
    );

    if (tokens.rows.length === 0) {
      this.logger.warn(`sendTestPush no active tokens userId=${userId}`);
      return { sentCount: 0 };
    }

    const title = payload.title?.trim() || 'Readovo test push';
    const body = payload.body?.trim() || 'This is a remote push test from backend.';
    let sentCount = 0;
    const sentTokenSet = new Set<string>();

    for (const tokenRow of tokens.rows) {
      if (sentTokenSet.has(tokenRow.expo_push_token)) {
        continue;
      }

      sentTokenSet.add(tokenRow.expo_push_token);
      const isSent = await this.sendExpoPush(tokenRow.expo_push_token, body, title);
      this.logger.log(
        `sendTestPush token delivery userId=${userId} deviceId=${tokenRow.device_id} sent=${String(isSent)}`,
      );

      if (!isSent) {
        await this.databaseService.query(
          `
            UPDATE user_push_tokens
            SET is_active = false, updated_at = now()
            WHERE user_id = $1 AND device_id = $2
          `,
          [userId, tokenRow.device_id],
        );
        continue;
      }

      sentCount += 1;
    }

    this.logger.log(`sendTestPush complete userId=${userId} sentCount=${sentCount}`);
    return { sentCount };
  }

  async dispatchLearningReminders(): Promise<void> {
    const eligibleUsersResult =
      await this.databaseService.query<EligibleUserRow>(
        `
        SELECT
          np.user_id,
          np.learning_reminder_time,
          sp.timezone
        FROM user_notification_preferences np
        JOIN user_streak_profiles sp ON sp.user_id = np.user_id
        WHERE np.learning_reminders_enabled = true
      `,
      );

    const now = new Date();

    for (const user of eligibleUsersResult.rows) {
      const userDate = this.getLocalDateKey(now, user.timezone);
      const userTime = this.getLocalTimeKey(now, user.timezone);

      if (!this.isWithinDispatchWindow(user.learning_reminder_time, userTime)) {
        continue;
      }

      const alreadySent = await this.databaseService.query<{
        reminder_date: string;
      }>(
        `
          SELECT reminder_date::text
          FROM user_learning_reminder_dispatches
          WHERE user_id = $1
            AND reminder_date = $2::date
          LIMIT 1
        `,
        [user.user_id, userDate],
      );

      if (alreadySent.rows[0]) {
        continue;
      }

      const completedToday = await this.databaseService.query<{
        status: string;
      }>(
        `
          SELECT status
          FROM user_streak_history
          WHERE user_id = $1
            AND activity_date = $2::date
            AND status = 'completed'
          LIMIT 1
        `,
        [user.user_id, userDate],
      );

      if (completedToday.rows[0]) {
        continue;
      }

      const tokens = await this.databaseService.query<PushTokenRow>(
        `
          SELECT device_id, expo_push_token
          FROM user_push_tokens
          WHERE user_id = $1
            AND is_active = true
        `,
        [user.user_id],
      );

      if (tokens.rows.length === 0) {
        continue;
      }

      const messageBody = this.pickMessageBody(now);
      const sentTokenSet = new Set<string>();

      for (const tokenRow of tokens.rows) {
        if (sentTokenSet.has(tokenRow.expo_push_token)) {
          continue;
        }

        sentTokenSet.add(tokenRow.expo_push_token);
        const isSent = await this.sendExpoPush(tokenRow.expo_push_token, messageBody);

        if (!isSent) {
          await this.databaseService.query(
            `
              UPDATE user_push_tokens
              SET is_active = false, updated_at = now()
              WHERE user_id = $1 AND device_id = $2
            `,
            [user.user_id, tokenRow.device_id],
          );
        }
      }

      await this.databaseService.query(
        `
          INSERT INTO user_learning_reminder_dispatches (user_id, reminder_date, sent_at)
          VALUES ($1, $2::date, now())
          ON CONFLICT (user_id, reminder_date) DO NOTHING
        `,
        [user.user_id, userDate],
      );
    }
  }

  private async ensurePreferencesRow(userId: string): Promise<void> {
    await this.databaseService.query(
      `
        INSERT INTO user_notification_preferences (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING
      `,
      [userId],
    );
  }

  private getLocalDateKey(serverNow: Date, timeZone: string): string {
    return new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      month: '2-digit',
      timeZone,
      year: 'numeric',
    }).format(serverNow);
  }

  private getLocalTimeKey(serverNow: Date, timeZone: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      timeZone,
    }).format(serverNow);
  }

  private isWithinDispatchWindow(
    targetTime: string,
    currentTime: string,
  ): boolean {
    if (
      !/^\d{2}:\d{2}$/.test(targetTime) ||
      !/^\d{2}:\d{2}$/.test(currentTime)
    ) {
      return false;
    }

    const toMinutes = (value: string) => {
      const [hour, minute] = value.split(':').map(Number);
      return hour * 60 + minute;
    };

    const delta = Math.abs(toMinutes(currentTime) - toMinutes(targetTime));
    return delta < DISPATCH_WINDOW_MINUTES;
  }

  private pickMessageBody(now: Date): string {
    const variants = [
      'Take a short test today and keep your progress moving.',
      'A quick quiz now will keep your learning streak alive.',
      'Return to Readovo and complete a test to stay on track.',
    ];

    return variants[now.getUTCDate() % variants.length] ?? variants[0];
  }

  private async sendExpoPush(to: string, body: string, title = 'Readovo'): Promise<boolean> {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        body: JSON.stringify({
          body,
          sound: 'default',
          title,
          to,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Push dispatch failed for token ${to}`, error);
      return false;
    }
  }
}
