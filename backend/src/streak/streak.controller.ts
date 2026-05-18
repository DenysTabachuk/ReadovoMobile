import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { StreakService } from './streak.service';
import {
  type ApplyStreakFreezeDto,
  type CompleteStreakActivityDto,
  type CompleteStreakActivityResponse,
  type PurchaseStreakFreezeDto,
  type RestoreStreakDto,
  type StreakCalendarMonthResponse,
  type StreakState,
} from './types';

@Controller('streak')
export class StreakController {
  constructor(private readonly streakService: StreakService) {}

  @Get('profile/:userId')
  async getProfile(@Param('userId') userId: string): Promise<StreakState> {
    return this.streakService.getProfile(userId);
  }

  @Get('profile/:userId/calendar/month')
  async getCalendarMonth(
    @Param('userId') userId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ): Promise<StreakCalendarMonthResponse> {
    return this.streakService.getCalendarMonth(
      userId,
      Number.parseInt(year, 10),
      Number.parseInt(month, 10),
    );
  }

  @Post('profile/:userId/activity-completed')
  async completeActivity(
    @Param('userId') userId: string,
    @Body() payload: CompleteStreakActivityDto,
  ): Promise<CompleteStreakActivityResponse> {
    return this.streakService.completeActivity(userId, payload);
  }

  @Post('profile/:userId/restore')
  async restoreStreak(
    @Param('userId') userId: string,
    @Body() payload: RestoreStreakDto,
  ): Promise<StreakState> {
    return this.streakService.restore(userId, payload.price);
  }

  @Post('profile/:userId/freeze')
  async applyFreeze(
    @Param('userId') userId: string,
    @Body() payload: ApplyStreakFreezeDto,
  ): Promise<StreakState> {
    return this.streakService.applyFreeze(userId, payload.date);
  }

  @Post('profile/:userId/freeze-token/purchase')
  async purchaseFreezeToken(
    @Param('userId') userId: string,
    @Body() payload: PurchaseStreakFreezeDto,
  ): Promise<StreakState> {
    return this.streakService.purchaseFreezeToken(userId, payload.price);
  }
}
