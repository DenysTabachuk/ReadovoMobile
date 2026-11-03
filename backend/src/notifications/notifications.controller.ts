import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { ApiUserAuth } from '../auth/api-user-auth.decorator';
import { ApiException } from '../common/errors/api-exception';
import { DeviceIdQueryDto } from './dto/device-id-query.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { SendTestPushDto } from './dto/send-test-push.dto';
import { UpsertLearningReminderPreferencesDto } from './dto/upsert-learning-reminder-preferences.dto';
import { GetLearningReminderPreferencesResponseDto } from './dto/get-learning-reminder-preferences-response.dto';
import { RegisterPushTokenResponseDto } from './dto/register-push-token-response.dto';
import { SendTestPushResponseDto } from './dto/send-test-push-response.dto';
import { DispatchLearningRemindersResponseDto } from './dto/dispatch-learning-reminders-response.dto';
import { ClearTodayLearningReminderDispatchResponseDto } from './dto/clear-today-learning-reminder-dispatch-response.dto';
import { NotificationsService } from './notifications.service';
import { NOTIFICATIONS_ERRORS } from './notifications-errors';
import type {
  LearningReminderDispatchResult,
  LearningReminderPreferences,
  SendTestPushResult,
} from './types';

@Controller('notifications')
@ApiTags('notifications')
@ApiExtraModels(DeviceIdQueryDto)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('preferences/me')
  @ApiOperation({
    operationId: 'getLearningReminderPreferences',
    summary: 'Read the authenticated user’s reminder preferences',
  })
  @ApiOkResponse({ type: GetLearningReminderPreferencesResponseDto })
  @ApiUserAuth()
  async getLearningReminderPreferences(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LearningReminderPreferences> {
    return this.notificationsService.getLearningReminderPreferences(user.id);
  }

  @Put('preferences/me')
  @ApiOperation({
    operationId: 'updateLearningReminderPreferences',
    summary:
      'Update reminder preferences using the server default for omitted/null time',
  })
  @ApiOkResponse({ type: GetLearningReminderPreferencesResponseDto })
  @ApiUserAuth({ validation: true })
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
  @ApiOperation({
    operationId: 'registerPushToken',
    summary: 'Register an Android FCM token for the authenticated user',
  })
  @ApiCreatedResponse({ type: RegisterPushTokenResponseDto })
  @ApiUserAuth({ validation: true })
  async registerPushToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: RegisterPushTokenDto,
  ): Promise<RegisterPushTokenResponseDto> {
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
  @ApiOperation({
    operationId: 'deactivatePushToken',
    summary: 'Deactivate the authenticated user’s device token',
  })
  @ApiOkResponse({ type: RegisterPushTokenResponseDto })
  @ApiUserAuth({ validation: true })
  async deactivatePushToken(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { deviceId }: DeviceIdQueryDto,
  ): Promise<RegisterPushTokenResponseDto> {
    await this.notificationsService.deactivatePushToken(user.id, deviceId);
    return { ok: true };
  }

  @Post('test-push/me')
  @ApiOperation({
    operationId: 'sendRemoteTestPush',
    summary:
      'Send a test push and return delivery counts, including failed deliveries',
  })
  @ApiBody({ type: SendTestPushDto, required: false })
  @ApiCreatedResponse({ type: SendTestPushResponseDto })
  @ApiUserAuth({ validation: true })
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
  @ApiOperation({
    operationId: 'clearTodayLearningReminderDispatch',
    summary: 'Clear today’s reminder dispatch record outside production',
    description:
      'Available to authenticated users only when NODE_ENV is not production; otherwise returns 403.',
  })
  @ApiOkResponse({ type: ClearTodayLearningReminderDispatchResponseDto })
  @ApiUserAuth({ errors: [NOTIFICATIONS_ERRORS.DISPATCH_CLEAR_DISABLED] })
  async clearTodayLearningReminderDispatchForDevelopment(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClearTodayLearningReminderDispatchResponseDto> {
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
  @ApiOperation({
    operationId: 'dispatchLearningRemindersNow',
    summary: 'Run reminder dispatch outside production',
    description:
      'Dispatches all eligible users, not only the caller. Available to authenticated users only when NODE_ENV is not production; otherwise returns 403.',
  })
  @ApiCreatedResponse({ type: DispatchLearningRemindersResponseDto })
  @ApiUserAuth({ errors: [NOTIFICATIONS_ERRORS.MANUAL_DISPATCH_DISABLED] })
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
