import {
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
  type ApiSchemaOptions,
  type SchemaObject,
} from '@nestjs/swagger';

import { Trim, TrimToLowerCase } from '../../common/validation/transforms';

import {
  TRANSLATION_CONTEXT_MAX_LENGTH,
  DEFAULT_TRANSLATION_PAIR,
  SUPPORTED_TRANSLATION_PAIRS,
  TRANSLATION_DEFAULT_SOURCE_LANGUAGE,
  TRANSLATION_DEFAULT_TARGET_LANGUAGE,
  TRANSLATION_SOURCE_LANGUAGES,
  TRANSLATION_TARGET_LANGUAGES,
  TRANSLATION_WORD_MAX_LENGTH,
} from '../constants';
import {
  type TranslationSourceLanguage,
  type TranslationTargetLanguage,
} from '../types';
import { createTranslationPairSchemas } from '../utils/createTranslationPairSchemas';
import { IsSupportedTranslationPair } from '../validation/is-supported-translation-pair.decorator';

// ApiSchema forwards schema metadata; keep this checked as both decorator options
// and a standard schema property. Export tests verify the closed-object contract.
const requestSchema: ApiSchemaOptions &
  Pick<SchemaObject, 'additionalProperties' | 'oneOf'> = {
  name: 'TranslateWordRequest',
  description: 'Unknown body properties are rejected by global DTO validation.',
  additionalProperties: false,
  oneOf: createTranslationPairSchemas(
    SUPPORTED_TRANSLATION_PAIRS,
    DEFAULT_TRANSLATION_PAIR,
  ),
};

@ApiSchema(requestSchema)
export class TranslateWordDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: TRANSLATION_CONTEXT_MAX_LENGTH,
    description: 'Sentence context. Strings are trimmed; null is preserved.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(TRANSLATION_CONTEXT_MAX_LENGTH)
  @Trim()
  context?: string | null;

  @ApiPropertyOptional({
    type: String,
    default: TRANSLATION_DEFAULT_SOURCE_LANGUAGE,
    description:
      'Trimmed and lowercased. Must form a supported pair with targetLanguage.',
    enum: TRANSLATION_SOURCE_LANGUAGES,
  })
  @IsIn(TRANSLATION_SOURCE_LANGUAGES)
  @TrimToLowerCase()
  sourceLanguage: TranslationSourceLanguage =
    TRANSLATION_DEFAULT_SOURCE_LANGUAGE;

  @ApiPropertyOptional({
    type: String,
    default: TRANSLATION_DEFAULT_TARGET_LANGUAGE,
    description:
      'Trimmed and lowercased. Must form a supported pair with sourceLanguage.',
    enum: TRANSLATION_TARGET_LANGUAGES,
  })
  @IsIn(TRANSLATION_TARGET_LANGUAGES)
  @IsSupportedTranslationPair(SUPPORTED_TRANSLATION_PAIRS)
  @TrimToLowerCase()
  targetLanguage: TranslationTargetLanguage =
    TRANSLATION_DEFAULT_TARGET_LANGUAGE;

  @ApiProperty({
    type: String,
    maxLength: TRANSLATION_WORD_MAX_LENGTH,
    minLength: 1,
    description: 'Selected word. Trimmed before length validation.',
    example: 'book',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(TRANSLATION_WORD_MAX_LENGTH)
  @Trim()
  declare word: string;
}
