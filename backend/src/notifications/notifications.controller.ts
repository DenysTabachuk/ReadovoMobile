import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UserAuthGuard } from '../auth/user-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { UserIdParamsDto } from '../common/validation/request.dto';
import {
  DeviceIdQueryDto,
  RegisterPushTokenDto,
  SendTestPushDto,
  UpsertLearningReminderPreferencesDto,
} from './dto';
import { NotificationsService } from './notifications.service';
import { NOTIFICATIONS_ERRORS } from './notifications-errors';
import type {
  LearningReminderDispatchResult,
  LearningReminderPreferences,
  SendTestPushResult,
} from './types';

@Controller('notifications')
@UseGuards(UserAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('preferences/:userId')
  async getLearningReminderPreferences(
    @Param() { userId }: UserIdParamsDto,
  ): Promise<LearningReminderPreferences> {
    return this.notificationsService.getLearningReminderPreferences(userId);
  }

  @Put('preferences/:userId')
  async upsertLearningReminderPreferences(
    @Param() { userId }: UserIdParamsDto,
    @Body() payload: UpsertLearningReminderPreferencesDto,
  ): Promise<LearningReminderPreferences> {
    try {
      return await this.notificationsService.upsertLearningReminderPreferences(
        userId,
        payload,
      );
    } catch (error) {
      this.logger.error('Learning reminder preferences update failed.');
      throw error;
    }
  }

  @Post('push-token/:userId')
  async registerPushToken(
    @Param() { userId }: UserIdParamsDto,
    @Body() payload: RegisterPushTokenDto,
  ): Promise<{ ok: true }> {
    this.logger.log(
      `registerPushToken request userId=${userId} deviceId=${payload.deviceId} platform=${payload.platform}`,
    );
    try {
      await this.notificationsService.registerPushToken(userId, payload);
      this.logger.log(
        `registerPushToken success userId=${userId} deviceId=${payload.deviceId}`,
      );
      return { ok: true };
    } catch (error) {
      // Push tokens and persistence errors can contain credentials or request data.
      this.logger.error('Push token registration failed.');
      throw error;
    }
  }

  @Delete('push-token/:userId')
  async deactivatePushToken(
    @Param() { userId }: UserIdParamsDto,
    @Query() { deviceId }: DeviceIdQueryDto,
  ): Promise<{ ok: true }> {
    await this.notificationsService.deactivatePushToken(userId, deviceId);
    return { ok: true };
  }

  @Post('test-push/:userId')
  async sendTestPush(
    @Param() { userId }: UserIdParamsDto,
    @Body() payload: SendTestPushDto,
  ): Promise<SendTestPushResult> {
    this.logger.log(`sendTestPush request userId=${userId}`);
    try {
      const result = await this.notificationsService.sendTestPush(
        userId,
        payload,
      );
      this.logger.log(
        `sendTestPush result userId=${userId} tokenCount=${result.tokenCount} sentCount=${result.sentCount} failedCount=${result.failedCount}`,
      );
      return result;
    } catch (error) {
      this.logger.error('Test push request failed.');
      throw error;
    }
  }

  @Delete('learning-reminders/dispatch/today/:userId')
  async clearTodayLearningReminderDispatchForDevelopment(
    @Param() { userId }: UserIdParamsDto,
  ): Promise<{ deletedCount: number }> {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiException(NOTIFICATIONS_ERRORS.DISPATCH_CLEAR_DISABLED);
    }

    this.logger.log(`clear today reminder dispatch requested userId=${userId}`);
    const result =
      await this.notificationsService.clearTodayLearningReminderDispatch(
        userId,
      );
    this.logger.log(
      `clear today reminder dispatch completed userId=${userId} deletedCount=${result.deletedCount}`,
    );

    return result;
  }

  @Post('learning-reminders/dispatch')
  async dispatchLearningRemindersForDevelopment(): Promise<LearningReminderDispatchResult> {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiException(NOTIFICATIONS_ERRORS.MANUAL_DISPATCH_DISABLED);
    }

    this.logger.log('manual learning reminder dispatch requested');
    let result: LearningReminderDispatchResult;

    try {
      result = await this.notificationsService.dispatchLearningReminders();
      this.logger.log(
        `manual learning reminder dispatch completed checked=${result.checkedCount} sent=${result.sentCount} outsideWindow=${result.skippedOutsideWindowCount} completedToday=${result.skippedCompletedTodayCount} alreadySent=${result.skippedAlreadySentCount} noTokens=${result.skippedNoTokensCount} sendFailed=${result.skippedSendFailedCount}`,
      );
    } catch (error) {
      this.logger.error('Manual learning reminder dispatch failed.');
      throw error;
    }

    return result;
  }
}
