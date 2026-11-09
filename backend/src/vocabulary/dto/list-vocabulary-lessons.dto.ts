import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import {
  DEFAULT_VOCABULARY_CONTENT_LOCALE,
  VOCABULARY_CONTENT_LOCALES,
} from '../constants';

export class ListVocabularyLessonsDto {
  @ApiPropertyOptional({
    enum: VOCABULARY_CONTENT_LOCALES,
    default: DEFAULT_VOCABULARY_CONTENT_LOCALE,
  })
  @IsIn(VOCABULARY_CONTENT_LOCALES)
  locale: (typeof VOCABULARY_CONTENT_LOCALES)[number] =
    DEFAULT_VOCABULARY_CONTENT_LOCALE;
}
