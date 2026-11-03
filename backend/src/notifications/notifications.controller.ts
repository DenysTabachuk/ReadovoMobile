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
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { ApiUserAuth } from '../auth/api-user-auth.decorator';
import { DeviceIdQueryDto } from './dto/device-id-query.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UpsertLearningReminderPreferencesDto } from './dto/upsert-learning-reminder-preferences.dto';
import { GetLearningReminderPreferencesResponseDto } from './dto/get-learning-reminder-preferences-response.dto';
import { RegisterPushTokenResponseDto } from './dto/register-push-token-response.dto';
import { NotificationsService } from './notifications.service';
import type { LearningReminderPreferences } from './types';

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
}
