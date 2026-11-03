import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  SUPPORTED_TRANSLATION_PAIRS,
  TRANSLATION_SOURCE_LANGUAGES,
  TRANSLATION_TARGET_LANGUAGES,
} from '../constants';
import {
  type TranslationSourceLanguage,
  type TranslationTargetLanguage,
} from '../types';
import { createTranslationPairSchemas } from '../utils/createTranslationPairSchemas';

const responseSchema = {
  name: 'TranslateWordResponse',
  oneOf: createTranslationPairSchemas(SUPPORTED_TRANSLATION_PAIRS),
};

/** Serialized HTTP response; undefined properties are omitted from JSON. */
@ApiSchema(responseSchema)
export class TranslateWordResponseDto {
  @ApiProperty({ type: String })
  declare baseTranslation: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  context?: string | null;

  @ApiPropertyOptional({ type: String })
  contextTranslation?: string;

  @ApiPropertyOptional({ type: String })
  contextualTranslation?: string;

  @ApiProperty({ type: String, enum: TRANSLATION_SOURCE_LANGUAGES })
  declare sourceLanguage: TranslationSourceLanguage;

  @ApiProperty({ type: String, enum: TRANSLATION_TARGET_LANGUAGES })
  declare targetLanguage: TranslationTargetLanguage;

  @ApiProperty({ type: String })
  declare translation: string;

  @ApiProperty({ type: String })
  declare word: string;
}
