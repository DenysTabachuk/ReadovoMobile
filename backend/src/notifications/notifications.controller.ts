import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { ApiException } from '../common/errors/api-exception';
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

  @Get('preferences/me')
  async getLearningReminderPreferences(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LearningReminderPreferences> {
    return this.notificationsService.getLearningReminderPreferences(user.id);
  }

  @Put('preferences/me')
  async upsertLearningReminderPreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: UpsertLearningReminderPreferencesDto,
  ): Promise<LearningReminderPreferences> {
    try {
      return await this.notificationsService.upsertLearningReminderPreferences(
        user.id,
        payload,
      );
    } catch (error) {
      this.logger.error('Learning reminder preferences update failed.');
      throw error;
    }
  }

  @Post('push-token/me')
  async registerPushToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: RegisterPushTokenDto,
  ): Promise<{ ok: true }> {
    this.logger.log(
      `registerPushToken request userId=${user.id} deviceId=${payload.deviceId} platform=${payload.platform}`,
    );
    try {
      await this.notificationsService.registerPushToken(user.id, payload);
      this.logger.log(
        `registerPushToken success userId=${user.id} deviceId=${payload.deviceId}`,
      );
      return { ok: true };
    } catch (error) {
      // Push tokens and persistence errors can contain credentials or request data.
      this.logger.error('Push token registration failed.');
      throw error;
    }
  }

  @Delete('push-token/me')
  async deactivatePushToken(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { deviceId }: DeviceIdQueryDto,
  ): Promise<{ ok: true }> {
    await this.notificationsService.deactivatePushToken(user.id, deviceId);
    return { ok: true };
  }

  @Post('test-push/me')
  async sendTestPush(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: SendTestPushDto,
  ): Promise<SendTestPushResult> {
    this.logger.log(`sendTestPush request userId=${user.id}`);
    try {
      const result = await this.notificationsService.sendTestPush(
        user.id,
        payload,
      );
      this.logger.log(
        `sendTestPush result userId=${user.id} tokenCount=${result.tokenCount} sentCount=${result.sentCount} failedCount=${result.failedCount}`,
      );
      return result;
    } catch (error) {
      this.logger.error('Test push request failed.');
      throw error;
    }
  }

  @Delete('learning-reminders/dispatch/today/me')
  async clearTodayLearningReminderDispatchForDevelopment(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ deletedCount: number }> {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiException(NOTIFICATIONS_ERRORS.DISPATCH_CLEAR_DISABLED);
    }

    this.logger.log(
      `clear today reminder dispatch requested userId=${user.id}`,
    );
    const result =
      await this.notificationsService.clearTodayLearningReminderDispatch(
        user.id,
      );
    this.logger.log(
      `clear today reminder dispatch completed userId=${user.id} deletedCount=${result.deletedCount}`,
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
