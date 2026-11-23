import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import {
  DEFAULT_LEARNING_CONTENT_LOCALE,
  LEARNING_CONTENT_LOCALES,
} from '../constants';

export class LearningLocaleDto {
  @ApiPropertyOptional({
    enum: LEARNING_CONTENT_LOCALES,
    default: DEFAULT_LEARNING_CONTENT_LOCALE,
  })
  @IsIn(LEARNING_CONTENT_LOCALES)
  locale: (typeof LEARNING_CONTENT_LOCALES)[number] =
    DEFAULT_LEARNING_CONTENT_LOCALE;
}
