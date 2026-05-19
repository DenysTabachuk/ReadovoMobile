import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { readFileSync } from 'node:fs';

import { DatabaseService } from '../database/database.service';
import type {
  LearningReminderDispatchResult,
  LearningReminderPreferences,
  RegisterPushTokenDto,
  SendTestPushDto,
  SendTestPushResult,
  UpsertLearningReminderPreferencesDto,
} from './types';

type EligibleUserRow = {
  learning_reminder_time: string;
  timezone: string;
  user_id: string;
};

type PushTokenRow = {
  device_id: string;
  push_token: string;
};

type PushSendResult = {
  failureReason?: string;
  sent: boolean;
  shouldDeactivateToken: boolean;
};

const DEFAULT_LEARNING_REMINDER_TIME = '19:00';
const DISPATCH_INTERVAL_MS = 60 * 1000;

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly messaging: Messaging | null;

  constructor(private readonly databaseService: DatabaseService) {
    this.messaging = this.createMessagingClient();
  }

  onModuleInit(): void {
    setInterval(
      () => {
        void this.dispatchLearningReminders();
      },
      DISPATCH_INTERVAL_MS,
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
    if (!payload.deviceId || !payload.pushToken) {
      throw new BadRequestException('deviceId and pushToken are required.');
    }

    if (payload.provider !== 'fcm') {
      throw new BadRequestException('Invalid push token provider.');
    }

    if (payload.platform !== 'android') {
      throw new BadRequestException('FCM push tokens are currently supported only for Android.');
    }

    if (payload.pushToken.trim().length < 32) {
      throw new BadRequestException('Invalid FCM push token.');
    }

    await this.databaseService.query(
      `
        UPDATE user_push_tokens
        SET is_active = false, updated_at = now()
        WHERE push_token = $1
          AND user_id <> $2
      `,
      [payload.pushToken, userId],
    );

    await this.databaseService.query(
      `
        INSERT INTO user_push_tokens (
          user_id,
          device_id,
          push_token,
          provider,
          platform,
          is_active,
          created_at,
          last_seen_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, true, now(), now(), now())
        ON CONFLICT (user_id, device_id)
        DO UPDATE SET
          push_token = EXCLUDED.push_token,
          provider = EXCLUDED.provider,
          platform = EXCLUDED.platform,
          is_active = true,
          last_seen_at = now(),
          updated_at = now()
      `,
      [
        userId,
        payload.deviceId,
        payload.pushToken.trim(),
        payload.provider,
        payload.platform,
      ],
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

  async clearTodayLearningReminderDispatch(userId: string): Promise<{ deletedCount: number }> {
    const profile = await this.databaseService.query<{ timezone: string }>(
      `
        SELECT timezone
        FROM user_streak_profiles
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    );
    const timezone = profile.rows[0]?.timezone ?? 'UTC';
    const today = this.getLocalDateKey(new Date(), timezone);
    const result = await this.databaseService.query(
      `
        DELETE FROM user_learning_reminder_dispatches
        WHERE user_id = $1
          AND reminder_date = $2::date
      `,
      [userId, today],
    );

    return {
      deletedCount: result.rowCount ?? 0,
    };
  }

  async sendTestPush(
    userId: string,
    payload: SendTestPushDto,
  ): Promise<SendTestPushResult> {
    this.logger.log(`sendTestPush start userId=${userId}`);
    const tokens = await this.databaseService.query<PushTokenRow>(
      `
        SELECT device_id, push_token
        FROM user_push_tokens
        WHERE user_id = $1
          AND provider = 'fcm'
          AND push_token IS NOT NULL
          AND is_active = true
      `,
      [userId],
    );

    if (tokens.rows.length === 0) {
      this.logger.warn(`sendTestPush no active tokens userId=${userId}`);
      return {
        failedCount: 0,
        failureReasons: [],
        sentCount: 0,
        tokenCount: 0,
      };
    }

    const title = payload.title?.trim() || 'Readovo test push';
    const body = payload.body?.trim() || 'This is a remote push test from backend.';
    let failedCount = 0;
    let sentCount = 0;
    const failureReasons = new Set<string>();
    const sentTokenSet = new Set<string>();

    for (const tokenRow of tokens.rows) {
      if (sentTokenSet.has(tokenRow.push_token)) {
        continue;
      }

      sentTokenSet.add(tokenRow.push_token);
      const sendResult = await this.sendFcmPush(tokenRow.push_token, body, title);
      this.logger.log(
        `sendTestPush token delivery userId=${userId} deviceId=${tokenRow.device_id} sent=${String(sendResult.sent)}`,
      );

      if (!sendResult.sent) {
        failedCount += 1;
        if (sendResult.failureReason) {
          failureReasons.add(sendResult.failureReason);
        }

        if (!sendResult.shouldDeactivateToken) {
          continue;
        }

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

    this.logger.log(
      `sendTestPush complete userId=${userId} tokenCount=${sentTokenSet.size} sentCount=${sentCount} failedCount=${failedCount}`,
    );

    return {
      failedCount,
      failureReasons: Array.from(failureReasons),
      sentCount,
      tokenCount: sentTokenSet.size,
    };
  }

  async dispatchLearningReminders(): Promise<LearningReminderDispatchResult> {
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
    const result: LearningReminderDispatchResult = {
      checkedCount: 0,
      sentCount: 0,
      skippedAlreadySentCount: 0,
      skippedCompletedTodayCount: 0,
      skippedNoTokensCount: 0,
      skippedOutsideWindowCount: 0,
      skippedSendFailedCount: 0,
    };

    for (const user of eligibleUsersResult.rows) {
      result.checkedCount += 1;

      const userDate = this.getLocalDateKey(now, user.timezone);
      const userTime = this.getLocalTimeKey(now, user.timezone);

      if (!this.isReminderDue(user.learning_reminder_time, userTime)) {
        result.skippedOutsideWindowCount += 1;
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
        result.skippedAlreadySentCount += 1;
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
        result.skippedCompletedTodayCount += 1;
        continue;
      }

      const tokens = await this.databaseService.query<PushTokenRow>(
        `
          SELECT device_id, push_token
          FROM user_push_tokens
          WHERE user_id = $1
            AND provider = 'fcm'
            AND push_token IS NOT NULL
            AND is_active = true
        `,
        [user.user_id],
      );

      if (tokens.rows.length === 0) {
        result.skippedNoTokensCount += 1;
        continue;
      }

      const messageBody = this.pickMessageBody(now);
      const sentTokenSet = new Set<string>();
      let userSentCount = 0;

      for (const tokenRow of tokens.rows) {
        if (sentTokenSet.has(tokenRow.push_token)) {
          continue;
        }

        sentTokenSet.add(tokenRow.push_token);
        const sendResult = await this.sendFcmPush(tokenRow.push_token, messageBody);

        if (sendResult.sent) {
          userSentCount += 1;
          result.sentCount += 1;
          continue;
        }

        if (sendResult.shouldDeactivateToken) {
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

      if (userSentCount === 0) {
        result.skippedSendFailedCount += 1;
        continue;
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

    return result;
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

  private isReminderDue(
    targetTime: string,
    currentTime: string,
  ): boolean {
    if (
      !/^\d{2}:\d{2}$/.test(targetTime) ||
      !/^\d{2}:\d{2}$/.test(currentTime)
    ) {
      return false;
    }

    return targetTime === currentTime;
  }

  private pickMessageBody(now: Date): string {
    const variants = [
      'Take a short test today and keep your progress moving.',
      'A quick quiz now will keep your learning streak alive.',
      'Return to Readovo and complete a test to stay on track.',
    ];

    return variants[now.getUTCDate() % variants.length] ?? variants[0];
  }

  private createMessagingClient(): Messaging | null {
    try {
      const existingApp = getApps()[0];
      const app = existingApp ?? this.initializeFirebaseApp();
      return getMessaging(app);
    } catch (error) {
      this.logger.warn(`Firebase Admin SDK is not configured: ${String(error)}`);
      return null;
    }
  }

  private initializeFirebaseApp(): App {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (serviceAccountPath) {
      return initializeApp({
        credential: cert(
          JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as Record<string, string>,
        ),
      });
    }

    if (serviceAccountJson) {
      return initializeApp({
        credential: cert(JSON.parse(serviceAccountJson) as Record<string, string>),
      });
    }

    if (projectId && clientEmail && privateKey) {
      return initializeApp({
        credential: cert({
          clientEmail,
          privateKey,
          projectId,
        }),
      });
    }

    return initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }

  private async sendFcmPush(
    to: string,
    body: string,
    title = 'Readovo',
  ): Promise<PushSendResult> {
    if (!this.messaging) {
      this.logger.warn('Push dispatch skipped because Firebase Admin SDK is not configured.');
      return {
        failureReason: 'Firebase Admin SDK is not configured.',
        sent: false,
        shouldDeactivateToken: false,
      };
    }

    try {
      await this.messaging.send({
        android: {
          notification: {
            channelId: 'default',
            sound: 'default',
          },
          priority: 'high',
        },
        notification: {
          body,
          title,
        },
        token: to,
      });

      return {
        sent: true,
        shouldDeactivateToken: false,
      };
    } catch (error) {
      this.logger.error(`Push dispatch failed for token ${to}`, error);
      return {
        failureReason: this.getFcmErrorMessage(error),
        sent: false,
        shouldDeactivateToken: this.isInvalidFcmTokenError(error),
      };
    }
  }

  private getFcmErrorMessage(error: unknown): string {
    if (typeof error !== 'object' || error === null) {
      return 'Unknown Firebase Cloud Messaging error.';
    }

    const code = 'code' in error ? String(error.code) : undefined;
    const message = 'message' in error ? String(error.message) : undefined;

    return [code, message].filter(Boolean).join(': ') || 'Unknown Firebase Cloud Messaging error.';
  }

  private isInvalidFcmTokenError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
      return false;
    }

    const code = String(error.code);

    return (
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/registration-token-not-registered'
    );
  }
}
