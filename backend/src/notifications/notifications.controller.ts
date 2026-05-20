import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UserAuthGuard } from '../auth/user-auth.guard';
import { NotificationsService } from './notifications.service';
import type {
  LearningReminderDispatchResult,
  LearningReminderPreferences,
  RegisterPushTokenDto,
  SendTestPushDto,
  SendTestPushResult,
  UpsertLearningReminderPreferencesDto,
} from './types';

@Controller('notifications')
@UseGuards(UserAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('preferences/:userId')
  async getLearningReminderPreferences(
    @Param('userId') userId: string,
  ): Promise<LearningReminderPreferences> {
    return this.notificationsService.getLearningReminderPreferences(userId);
  }

  @Put('preferences/:userId')
  async upsertLearningReminderPreferences(
    @Param('userId') userId: string,
    @Body() payload: UpsertLearningReminderPreferencesDto,
  ): Promise<LearningReminderPreferences> {
    try {
      return await this.notificationsService.upsertLearningReminderPreferences(
        userId,
        payload,
      );
    } catch (error) {
      this.logger.error(
        `upsertLearningReminderPreferences failed userId=${userId} payload=${JSON.stringify(payload)}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  @Post('push-token/:userId')
  async registerPushToken(
    @Param('userId') userId: string,
    @Body() payload: RegisterPushTokenDto,
  ): Promise<{ ok: true }> {
    this.logger.log(
      `registerPushToken request userId=${userId} deviceId=${payload.deviceId} platform=${payload.platform}`,
    );
    try {
      await this.notificationsService.registerPushToken(userId, payload);
      this.logger.log(`registerPushToken success userId=${userId} deviceId=${payload.deviceId}`);
      return { ok: true };
    } catch (error) {
      this.logger.error(
        `registerPushToken failed userId=${userId} payload=${JSON.stringify({
          ...payload,
          pushToken: payload.pushToken
            ? `${payload.pushToken.slice(0, 24)}...`
            : payload.pushToken,
        })}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  @Delete('push-token/:userId')
  async deactivatePushToken(
    @Param('userId') userId: string,
    @Query('deviceId') deviceId: string,
  ): Promise<{ ok: true }> {
    await this.notificationsService.deactivatePushToken(userId, deviceId);
    return { ok: true };
  }

  @Post('test-push/:userId')
  async sendTestPush(
    @Param('userId') userId: string,
    @Body() payload: SendTestPushDto,
  ): Promise<SendTestPushResult> {
    this.logger.log(`sendTestPush request userId=${userId}`);
    try {
      const result = await this.notificationsService.sendTestPush(userId, payload);
      this.logger.log(
        `sendTestPush result userId=${userId} tokenCount=${result.tokenCount} sentCount=${result.sentCount} failedCount=${result.failedCount} reasons=${result.failureReasons.join(' | ')}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `sendTestPush failed userId=${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  @Delete('learning-reminders/dispatch/today/:userId')
  async clearTodayLearningReminderDispatchForDevelopment(
    @Param('userId') userId: string,
  ): Promise<{ deletedCount: number }> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Clearing reminder dispatches is disabled in production.');
    }

    this.logger.log(`clear today reminder dispatch requested userId=${userId}`);
    const result =
      await this.notificationsService.clearTodayLearningReminderDispatch(userId);
    this.logger.log(
      `clear today reminder dispatch completed userId=${userId} deletedCount=${result.deletedCount}`,
    );

    return result;
  }

  @Post('learning-reminders/dispatch')
  async dispatchLearningRemindersForDevelopment(): Promise<LearningReminderDispatchResult> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Manual reminder dispatch is disabled in production.');
    }

    this.logger.log('manual learning reminder dispatch requested');
    let result: LearningReminderDispatchResult;

    try {
      result = await this.notificationsService.dispatchLearningReminders();
      this.logger.log(
        `manual learning reminder dispatch completed checked=${result.checkedCount} sent=${result.sentCount} outsideWindow=${result.skippedOutsideWindowCount} completedToday=${result.skippedCompletedTodayCount} alreadySent=${result.skippedAlreadySentCount} noTokens=${result.skippedNoTokensCount} sendFailed=${result.skippedSendFailedCount}`,
      );
    } catch (error) {
      this.logger.error(
        'manual learning reminder dispatch failed',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }

    return result;
  }
}
