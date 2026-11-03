import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ApiUserAuth } from '../auth/api-user-auth.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { type AuthenticatedUser } from '../auth/types';
import { ApplyStreakFreezeDto } from './dto/apply-streak-freeze.dto';
import { StreakCalendarQueryDto } from './dto/streak-calendar-query.dto';
import { GetStreakProfileResponseDto } from './dto/get-streak-profile-response.dto';
import { GetStreakCalendarMonthResponseDto } from './dto/get-streak-calendar-month-response.dto';
import { STREAK_ERRORS } from './streak-errors';
import { StreakService } from './streak.service';
import { type StreakCalendarMonthResponse, type StreakState } from './types';

@Controller('streak')
@ApiTags('streak')
@ApiExtraModels(StreakCalendarQueryDto)
export class StreakController {
  constructor(private readonly streakService: StreakService) {}

  @Get('profile/me')
  @ApiOperation({
    operationId: 'getStreakProfile',
    summary: 'Read the authenticated user’s streak state',
  })
  @ApiOkResponse({ type: GetStreakProfileResponseDto })
  @ApiUserAuth({ errors: [STREAK_ERRORS.USER_NOT_FOUND] })
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StreakState> {
    return this.streakService.getProfile(user.id);
  }

  @Get('profile/me/calendar/month')
  @ApiOperation({
    operationId: 'getStreakCalendarMonth',
    summary: 'Read a local calendar month of streak activity',
  })
  @ApiOkResponse({ type: GetStreakCalendarMonthResponseDto })
  @ApiUserAuth({
    validation: true,
    errors: [
      STREAK_ERRORS.USER_NOT_FOUND,
      STREAK_ERRORS.CALENDAR_MONTH_UNAVAILABLE,
    ],
  })
  async getCalendarMonth(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { month, year }: StreakCalendarQueryDto,
  ): Promise<StreakCalendarMonthResponse> {
    return this.streakService.getCalendarMonth(user.id, year, month);
  }

  @Post('profile/me/restore')
  @ApiOperation({
    operationId: 'restoreBrokenStreak',
    summary: 'Restore the current break using the server-defined price',
  })
  @ApiCreatedResponse({ type: GetStreakProfileResponseDto })
  @ApiUserAuth({
    errors: [
      STREAK_ERRORS.USER_NOT_FOUND,
      STREAK_ERRORS.RESTORE_UNAVAILABLE,
      STREAK_ERRORS.NOT_ENOUGH_COINS,
    ],
  })
  async restoreStreak(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StreakState> {
    return this.streakService.restore(user.id);
  }

  @Post('profile/me/freeze')
  @ApiOperation({
    operationId: 'applyStreakFreeze',
    summary: 'Use a freeze token for a missed day',
  })
  @ApiCreatedResponse({ type: GetStreakProfileResponseDto })
  @ApiUserAuth({
    validation: true,
    errors: [
      STREAK_ERRORS.USER_NOT_FOUND,
      STREAK_ERRORS.NO_FREEZE_TOKENS,
      STREAK_ERRORS.DAY_ALREADY_PROTECTED,
      STREAK_ERRORS.FREEZE_ONLY_MISSED_DAY,
      STREAK_ERRORS.FREEZE_DAY_LIMIT_REACHED,
    ],
  })
  async applyFreeze(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: ApplyStreakFreezeDto,
  ): Promise<StreakState> {
    return this.streakService.applyFreeze(user.id, payload.date);
  }

  @Post('profile/me/freeze-token/purchase')
  @ApiOperation({
    operationId: 'purchaseStreakFreezeToken',
    summary: 'Buy a freeze token using the server-defined price',
  })
  @ApiCreatedResponse({ type: GetStreakProfileResponseDto })
  @ApiUserAuth({
    errors: [
      STREAK_ERRORS.USER_NOT_FOUND,
      STREAK_ERRORS.FREEZE_TOKEN_LIMIT_REACHED,
      STREAK_ERRORS.NOT_ENOUGH_COINS,
    ],
  })
  async purchaseFreezeToken(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StreakState> {
    return this.streakService.purchaseFreezeToken(user.id);
  }
}
