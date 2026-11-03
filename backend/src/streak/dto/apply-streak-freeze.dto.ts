import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { Trim } from '../../common/validation/transforms';
import { IsDateOnly } from '../../common/validation/date-only.decorator';

const requestSchema = {
  name: 'ApplyStreakFreezeRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class ApplyStreakFreezeDto {
  @ApiProperty({
    type: String,
    format: 'date',
    description:
      'Missed local calendar day (YYYY-MM-DD). Trimmed before validation.',
    example: '2026-10-27',
  })
  @IsDateOnly()
  @Trim()
  declare date: string;
}
