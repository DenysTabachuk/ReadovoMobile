import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

import { ToNumber } from '../../common/validation/transforms';

const MIN_CALENDAR_MONTH = 1;
const MAX_CALENDAR_MONTH = 12;
const MIN_CALENDAR_YEAR = 1970;
const MAX_CALENDAR_YEAR = 2100;
const querySchema = {
  name: 'StreakCalendarMonthQuery',
  additionalProperties: false,
};

@ApiSchema(querySchema)
export class StreakCalendarQueryDto {
  @ApiProperty({
    type: 'integer',
    minimum: MIN_CALENDAR_MONTH,
    maximum: MAX_CALENDAR_MONTH,
    description: 'Calendar month, converted from query text to a number.',
  })
  @IsInt()
  @Max(MAX_CALENDAR_MONTH)
  @Min(MIN_CALENDAR_MONTH)
  @ToNumber()
  declare month: number;

  @ApiProperty({
    type: 'integer',
    minimum: MIN_CALENDAR_YEAR,
    maximum: MAX_CALENDAR_YEAR,
    description: 'Calendar year. Future months are rejected by the service.',
  })
  @IsInt()
  @Max(MAX_CALENDAR_YEAR)
  @Min(MIN_CALENDAR_YEAR)
  @ToNumber()
  declare year: number;
}
