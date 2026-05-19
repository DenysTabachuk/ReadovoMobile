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
import { NotificationsService } from './notifications.service';
import type {
  LearningReminderPreferences,
  RegisterPushTokenDto,
  SendTestPushDto,
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
    return this.notificationsService.upsertLearningReminderPreferences(
      userId,
      payload,
    );
  }

  @Post('push-token/:userId')
  async registerPushToken(
    @Param('userId') userId: string,
    @Body() payload: RegisterPushTokenDto,
  ): Promise<{ ok: true }> {
    this.logger.log(
      `registerPushToken request userId=${userId} deviceId=${payload.deviceId} platform=${payload.platform}`,
    );
    await this.notificationsService.registerPushToken(userId, payload);
    this.logger.log(`registerPushToken success userId=${userId} deviceId=${payload.deviceId}`);
    return { ok: true };
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
  ): Promise<{ sentCount: number }> {
    this.logger.log(`sendTestPush request userId=${userId}`);
    const result = await this.notificationsService.sendTestPush(userId, payload);
    this.logger.log(`sendTestPush result userId=${userId} sentCount=${result.sentCount}`);
    return result;
  }
}
