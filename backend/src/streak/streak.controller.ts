import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UserAuthGuard } from '../auth/user-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { type AuthenticatedUser } from '../auth/types';
import { UserIdParamsDto } from '../common/validation/request.dto';
import {
  ApplyStreakFreezeDto,
  CompleteStreakActivityDto,
  PurchaseStreakFreezeDto,
  RestoreStreakDto,
  StreakCalendarQueryDto,
} from './dto';
import { StreakService } from './streak.service';
import {
  type CompleteStreakActivityResponse,
  type StreakCalendarMonthResponse,
  type StreakState,
} from './types';

@Controller('streak')
@UseGuards(UserAuthGuard)
export class StreakController {
  constructor(private readonly streakService: StreakService) {}

  @Get('profile/:userId')
  async getProfile(@Param() { userId }: UserIdParamsDto): Promise<StreakState> {
    return this.streakService.getProfile(userId);
  }

  @Get('profile/me/calendar/month')
  async getCalendarMonth(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { month, year }: StreakCalendarQueryDto,
  ): Promise<StreakCalendarMonthResponse> {
    return this.streakService.getCalendarMonth(user.id, year, month);
  }

  @Post('profile/:userId/activity-completed')
  async completeActivity(
    @Param() { userId }: UserIdParamsDto,
    @Body() payload: CompleteStreakActivityDto,
  ): Promise<CompleteStreakActivityResponse> {
    return this.streakService.completeActivity(userId, payload);
  }

  @Post('profile/:userId/restore')
  async restoreStreak(
    @Param() { userId }: UserIdParamsDto,
    @Body() payload: RestoreStreakDto,
  ): Promise<StreakState> {
    return this.streakService.restore(userId, payload.price);
  }

  @Post('profile/:userId/freeze')
  async applyFreeze(
    @Param() { userId }: UserIdParamsDto,
    @Body() payload: ApplyStreakFreezeDto,
  ): Promise<StreakState> {
    return this.streakService.applyFreeze(userId, payload.date);
  }

  @Post('profile/:userId/freeze-token/purchase')
  async purchaseFreezeToken(
    @Param() { userId }: UserIdParamsDto,
    @Body() payload: PurchaseStreakFreezeDto,
  ): Promise<StreakState> {
    return this.streakService.purchaseFreezeToken(userId, payload.price);
  }
}
