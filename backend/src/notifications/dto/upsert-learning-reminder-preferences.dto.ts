import { IsBoolean, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

import { Trim } from '../../common/validation/transforms';
import {
  DEFAULT_LEARNING_REMINDER_TIME,
  LEARNING_REMINDER_TIME_PATTERN,
} from '../constants';

const requestSchema = {
  name: 'UpdateLearningReminderPreferencesRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class UpsertLearningReminderPreferencesDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    pattern: LEARNING_REMINDER_TIME_PATTERN.source,
    default: DEFAULT_LEARNING_REMINDER_TIME,
    description:
      'HH:mm, trimmed before validation. Omission or null resets the time to the backend default, including for an existing row.',
  })
  @IsOptional()
  @Matches(LEARNING_REMINDER_TIME_PATTERN)
  @Trim()
  learningReminderTime?: string | null;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  declare learningRemindersEnabled: boolean;
}
