import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { STREAK_CALENDAR_DAY_STATUSES } from '../constants';
import { type CalendarDayStatus } from '../types';

@ApiSchema({ name: 'StreakCalendarDay' })
export class StreakCalendarDayDto {
  @ApiProperty({ type: String, format: 'date' })
  declare date: string;

  @ApiProperty({ type: Number })
  declare dayOfMonth: number;

  @ApiProperty({
    enum: STREAK_CALENDAR_DAY_STATUSES,
    enumName: 'CalendarDayStatus',
  })
  declare status: CalendarDayStatus;
}

@ApiSchema({ name: 'StreakCalendarMonthResponse' })
export class GetStreakCalendarMonthResponseDto {
  @ApiProperty({ type: [StreakCalendarDayDto] })
  declare days: StreakCalendarDayDto[];

  @ApiProperty({ type: Number })
  declare month: number;

  @ApiProperty({
    type: String,
    description: 'Existing backend-formatted display label.',
  })
  declare monthLabel: string;

  @ApiProperty({ type: String, format: 'date-time' })
  declare serverNow: string;

  @ApiProperty({ type: String })
  declare timezone: string;

  @ApiProperty({ type: Number })
  declare year: number;
}
