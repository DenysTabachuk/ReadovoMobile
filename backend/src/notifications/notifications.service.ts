import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
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
import { existsSync, readFileSync } from 'node:fs';

import { dateOnlyToDate } from '../common/database/date-only';
import { PrismaService } from '../prisma/prisma.service';
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
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly messaging: Messaging | null;
  private dispatchTimer?: ReturnType<typeof setInterval>;

  constructor(private readonly prisma: PrismaService) {
    this.messaging = this.createMessagingClient();
  }

  onModuleInit(): void {
    this.dispatchTimer = setInterval(() => {
      void this.dispatchLearningReminders();
    }, DISPATCH_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.dispatchTimer) {
      clearInterval(this.dispatchTimer);
      this.dispatchTimer = undefined;
    }
  }

  async getLearningReminderPreferences(
    userId: string,
  ): Promise<LearningReminderPreferences> {
    await this.ensurePreferencesRow(userId);

    const row = await this.prisma.userNotificationPreference.findUniqueOrThrow({
      where: { userId },
    });

    return {
      learningReminderTime: row.learningReminderTime,
      learningRemindersEnabled: row.learningRemindersEnabled,
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

    await this.prisma.userNotificationPreference.upsert({
      create: {
        learningReminderTime: reminderTime,
        learningRemindersEnabled: payload.learningRemindersEnabled,
        userId,
      },
      update: {
        learningReminderTime: reminderTime,
        learningRemindersEnabled: payload.learningRemindersEnabled,
        updatedAt: new Date(),
      },
      where: { userId },
    });

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
      throw new BadRequestException(
        'FCM push tokens are currently supported only for Android.',
      );
    }

    if (payload.pushToken.trim().length < 32) {
      throw new BadRequestException('Invalid FCM push token.');
    }

    const now = new Date();
    const pushToken = payload.pushToken.trim();
    await this.prisma.userPushToken.updateMany({
      data: { isActive: false, pushToken: null, updatedAt: now },
      where: { pushToken, userId: { not: userId } },
    });

    await this.prisma.userPushToken.upsert({
      create: {
        deviceId: payload.deviceId,
        isActive: true,
        lastSeenAt: now,
        platform: payload.platform,
        provider: payload.provider,
        pushToken,
        updatedAt: now,
        userId,
      },
      update: {
        isActive: true,
        lastSeenAt: now,
        platform: payload.platform,
        provider: payload.provider,
        pushToken,
        updatedAt: now,
      },
      where: {
        userId_deviceId: { deviceId: payload.deviceId, userId },
      },
    });
    this.logger.log(
      `registerPushToken upsert done userId=${userId} deviceId=${payload.deviceId}`,
    );
  }

  async deactivatePushToken(userId: string, deviceId: string): Promise<void> {
    await this.prisma.userPushToken.updateMany({
      data: { isActive: false, updatedAt: new Date() },
      where: { deviceId, userId },
    });
  }

  async clearTodayLearningReminderDispatch(
    userId: string,
  ): Promise<{ deletedCount: number }> {
    const profile = await this.prisma.userStreakProfile.findUnique({
      select: { timezone: true },
      where: { userId },
    });
    const timezone = profile?.timezone ?? 'UTC';
    const today = this.getLocalDateKey(new Date(), timezone);
    const result = await this.prisma.userLearningReminderDispatch.deleteMany({
      where: { reminderDate: dateOnlyToDate(today), userId },
    });

    return {
      deletedCount: result.count,
    };
  }

  async sendTestPush(
    userId: string,
    payload: SendTestPushDto,
  ): Promise<SendTestPushResult> {
    this.logger.log(`sendTestPush start userId=${userId}`);
    const tokens = await this.getActivePushTokens(userId);

    if (tokens.length === 0) {
      this.logger.warn(`sendTestPush no active tokens userId=${userId}`);
      return {
        failedCount: 0,
        failureReasons: [],
        sentCount: 0,
        tokenCount: 0,
      };
    }

    const title = payload.title?.trim() || 'Readovo test push';
    const body =
      payload.body?.trim() || 'This is a remote push test from backend.';
    let failedCount = 0;
    let sentCount = 0;
    const failureReasons = new Set<string>();
    const sentTokenSet = new Set<string>();

    for (const tokenRow of tokens) {
      if (sentTokenSet.has(tokenRow.push_token)) {
        continue;
      }

      sentTokenSet.add(tokenRow.push_token);
      const sendResult = await this.sendFcmPush(
        tokenRow.push_token,
        body,
        title,
      );
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

        await this.deactivatePushToken(userId, tokenRow.device_id);
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
    const eligiblePreferences =
      await this.prisma.userNotificationPreference.findMany({
        include: {
          user: { select: { streakProfile: { select: { timezone: true } } } },
        },
        where: { learningRemindersEnabled: true },
      });
    const eligibleUsers: EligibleUserRow[] = eligiblePreferences.flatMap(
      (preference) =>
        preference.user.streakProfile
          ? [
              {
                learning_reminder_time: preference.learningReminderTime,
                timezone: preference.user.streakProfile.timezone,
                user_id: preference.userId,
              },
            ]
          : [],
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

    for (const user of eligibleUsers) {
      result.checkedCount += 1;

      const userDate = this.getLocalDateKey(now, user.timezone);
      const userTime = this.getLocalTimeKey(now, user.timezone);

      if (!this.isReminderDue(user.learning_reminder_time, userTime)) {
        result.skippedOutsideWindowCount += 1;
        continue;
      }

      const reminderDate = dateOnlyToDate(userDate);
      const alreadySent =
        await this.prisma.userLearningReminderDispatch.findUnique({
          where: {
            userId_reminderDate: {
              reminderDate,
              userId: user.user_id,
            },
          },
        });

      if (alreadySent) {
        result.skippedAlreadySentCount += 1;
        continue;
      }

      const completedToday = await this.prisma.userStreakHistory.findFirst({
        where: {
          activityDate: reminderDate,
          status: 'completed',
          userId: user.user_id,
        },
      });

      if (completedToday) {
        result.skippedCompletedTodayCount += 1;
        continue;
      }

      const tokens = await this.getActivePushTokens(user.user_id);

      if (tokens.length === 0) {
        result.skippedNoTokensCount += 1;
        continue;
      }

      const messageBody = this.pickMessageBody(now);
      const sentTokenSet = new Set<string>();
      let userSentCount = 0;

      for (const tokenRow of tokens) {
        if (sentTokenSet.has(tokenRow.push_token)) {
          continue;
        }

        sentTokenSet.add(tokenRow.push_token);
        const sendResult = await this.sendFcmPush(
          tokenRow.push_token,
          messageBody,
        );

        if (sendResult.sent) {
          userSentCount += 1;
          result.sentCount += 1;
          continue;
        }

        if (sendResult.shouldDeactivateToken) {
          await this.deactivatePushToken(user.user_id, tokenRow.device_id);
        }
      }

      if (userSentCount === 0) {
        result.skippedSendFailedCount += 1;
        continue;
      }

      await this.prisma.userLearningReminderDispatch.upsert({
        create: { reminderDate, userId: user.user_id },
        update: {},
        where: {
          userId_reminderDate: {
            reminderDate,
            userId: user.user_id,
          },
        },
      });
    }

    return result;
  }

  private async ensurePreferencesRow(userId: string): Promise<void> {
    await this.prisma.userNotificationPreference.upsert({
      create: { userId },
      update: {},
      where: { userId },
    });
  }

  private async getActivePushTokens(userId: string): Promise<PushTokenRow[]> {
    const rows = await this.prisma.userPushToken.findMany({
      select: { deviceId: true, pushToken: true },
      where: {
        isActive: true,
        provider: 'fcm',
        pushToken: { not: null },
        userId,
      },
    });

    return rows.flatMap((row) =>
      row.pushToken
        ? [{ device_id: row.deviceId, push_token: row.pushToken }]
        : [],
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

  private isReminderDue(targetTime: string, currentTime: string): boolean {
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
      this.logger.warn(
        `Firebase Admin SDK is not configured: ${String(error)}`,
      );
      return null;
    }
  }

  private initializeFirebaseApp(): App {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (serviceAccountJson) {
      return initializeApp({
        credential: cert(
          JSON.parse(serviceAccountJson) as Record<string, string>,
        ),
      });
    }

    if (serviceAccountPath && existsSync(serviceAccountPath)) {
      return initializeApp({
        credential: cert(
          JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as Record<
            string,
            string
          >,
        ),
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

    if (projectId) {
      return initializeApp({
        credential: applicationDefault(),
        projectId,
      });
    }

    throw new Error(
      'Firebase credentials are missing. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.',
    );
  }

  private async sendFcmPush(
    to: string,
    body: string,
    title = 'Readovo',
  ): Promise<PushSendResult> {
    if (!this.messaging) {
      this.logger.warn(
        'Push dispatch skipped because Firebase Admin SDK is not configured.',
      );
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

    return (
      [code, message].filter(Boolean).join(': ') ||
      'Unknown Firebase Cloud Messaging error.'
    );
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
