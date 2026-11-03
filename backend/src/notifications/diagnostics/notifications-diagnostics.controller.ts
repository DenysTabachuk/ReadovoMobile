import { Body, Controller, Delete, Logger, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ApiUserAuth } from '../../auth/api-user-auth.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import { type AuthenticatedUser } from '../../auth/types';
import { ApiException } from '../../common/errors/api-exception';
import { ClearTodayLearningReminderDispatchResponseDto } from './dto/clear-today-learning-reminder-dispatch-response.dto';
import { DispatchLearningRemindersResponseDto } from '../dto/dispatch-learning-reminders-response.dto';
import { SendTestPushResponseDto } from '../dto/send-test-push-response.dto';
import { SendTestPushDto } from '../dto/send-test-push.dto';
import { NOTIFICATIONS_ERRORS } from './notifications-errors';
import { NotificationsService } from '../notifications.service';
import {
  type LearningReminderDispatchResult,
  type SendTestPushResult,
} from '../types';

// Registered only by the optional diagnostics module, never the production root.
@Controller('notifications')
@ApiTags('Notification diagnostics')
export class NotificationsDiagnosticsController {
  private readonly logger = new Logger(NotificationsDiagnosticsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test-push/me')
  @ApiOperation({
    operationId: 'sendRemoteTestPush',
    summary: 'Send a development test push and return delivery counts',
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
    summary: 'Clear today’s reminder dispatch record for development',
    description:
      'Available only when the diagnostics module is installed. Its production safety check returns 403 if the running environment changes.',
  })
  @ApiOkResponse({ type: ClearTodayLearningReminderDispatchResponseDto })
  @ApiUserAuth({ errors: [NOTIFICATIONS_ERRORS.DISPATCH_CLEAR_DISABLED] })
  async clearTodayLearningReminderDispatchForDevelopment(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClearTodayLearningReminderDispatchResponseDto> {
    if (process.env.NODE_ENV === 'production')
      throw new ApiException(NOTIFICATIONS_ERRORS.DISPATCH_CLEAR_DISABLED);
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
    summary: 'Run reminder dispatch for development',
    description:
      'Processes all eligible users. Available only when the diagnostics module is installed; its production safety check returns 403 if the running environment changes.',
  })
  @ApiCreatedResponse({ type: DispatchLearningRemindersResponseDto })
  @ApiUserAuth({ errors: [NOTIFICATIONS_ERRORS.MANUAL_DISPATCH_DISABLED] })
  async dispatchLearningRemindersForDevelopment(): Promise<LearningReminderDispatchResult> {
    if (process.env.NODE_ENV === 'production')
      throw new ApiException(NOTIFICATIONS_ERRORS.MANUAL_DISPATCH_DISABLED);
    this.logger.log('manual learning reminder dispatch requested');
    try {
      const result =
        await this.notificationsService.dispatchLearningReminders();
      this.logger.log(
        `manual learning reminder dispatch completed checked=${result.checkedCount} sent=${result.sentCount} outsideWindow=${result.skippedOutsideWindowCount} completedToday=${result.skippedCompletedTodayCount} alreadySent=${result.skippedAlreadySentCount} noTokens=${result.skippedNoTokensCount} sendFailed=${result.skippedSendFailedCount}`,
      );
      return result;
    } catch (error) {
      this.logger.error('Manual learning reminder dispatch failed.');
      throw error;
    }
  }
}
