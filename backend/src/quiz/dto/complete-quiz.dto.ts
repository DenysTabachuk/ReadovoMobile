import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsTimeZone } from 'class-validator';

import { Trim } from '../../common/validation/transforms';

const requestSchema = {
  name: 'CompleteQuizRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class CompleteQuizDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      'IANA timezone, trimmed before validation. Omission or null retains the stored timezone (UTC for a new profile).',
    example: 'Europe/Kyiv',
  })
  @IsOptional()
  @IsTimeZone()
  @Trim()
  timezone?: string | null;
}
