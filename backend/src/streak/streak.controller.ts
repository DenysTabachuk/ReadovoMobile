import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { UserAuthGuard } from '../auth/user-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { type AuthenticatedUser } from '../auth/types';
import {
  ApplyStreakFreezeDto,
  PurchaseStreakFreezeDto,
  RestoreStreakDto,
  StreakCalendarQueryDto,
} from './dto';
import { StreakService } from './streak.service';
import { type StreakCalendarMonthResponse, type StreakState } from './types';

@Controller('streak')
@UseGuards(UserAuthGuard)
export class StreakController {
  constructor(private readonly streakService: StreakService) {}

  @Get('profile/me')
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StreakState> {
    return this.streakService.getProfile(user.id);
  }

  @Get('profile/me/calendar/month')
  async getCalendarMonth(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { month, year }: StreakCalendarQueryDto,
  ): Promise<StreakCalendarMonthResponse> {
    return this.streakService.getCalendarMonth(user.id, year, month);
  }

  @Post('profile/me/restore')
  async restoreStreak(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: RestoreStreakDto,
  ): Promise<StreakState> {
    return this.streakService.restore(user.id, payload.price);
  }

  @Post('profile/me/freeze')
  async applyFreeze(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: ApplyStreakFreezeDto,
  ): Promise<StreakState> {
    return this.streakService.applyFreeze(user.id, payload.date);
  }

  @Post('profile/me/freeze-token/purchase')
  async purchaseFreezeToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: PurchaseStreakFreezeDto,
  ): Promise<StreakState> {
    return this.streakService.purchaseFreezeToken(user.id, payload.price);
  }
}
