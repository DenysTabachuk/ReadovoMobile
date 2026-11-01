import { IsInt, Max, Min } from 'class-validator';

import { ToNumber, Trim } from '../common/validation/transforms';
import { IsDateOnly } from '../common/validation/date-only.decorator';

export class ApplyStreakFreezeDto {
  @IsDateOnly()
  @Trim()
  date!: string;
}

export class StreakCalendarQueryDto {
  @IsInt()
  @Max(12)
  @Min(1)
  @ToNumber()
  month!: number;

  @IsInt()
  @Max(2100)
  @Min(1970)
  @ToNumber()
  year!: number;
}
