import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { StreakService } from './streak.service';
import {
  type CompleteStreakActivityDto,
  type CompleteStreakActivityResponse,
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
}
