import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
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
  TRANSLATION_DEFAULT_SOURCE_LANGUAGE,
  TRANSLATION_DEFAULT_TARGET_LANGUAGE,
  TRANSLATION_LANGUAGE_CODE_PATTERN,
  TRANSLATION_WORD_MAX_LENGTH,
} from '../constants';

// ApiSchema forwards schema metadata; keep this checked as both decorator options
// and a standard schema property. Export tests verify the closed-object contract.
const requestSchema: ApiSchemaOptions &
  Pick<SchemaObject, 'additionalProperties'> = {
  name: 'TranslateWordRequest',
  description: 'Unknown body properties are rejected by global DTO validation.',
  additionalProperties: false,
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
    description: 'Trimmed and lowercased before format validation.',
    pattern: TRANSLATION_LANGUAGE_CODE_PATTERN.source,
  })
  @Matches(TRANSLATION_LANGUAGE_CODE_PATTERN)
  @TrimToLowerCase()
  sourceLanguage = TRANSLATION_DEFAULT_SOURCE_LANGUAGE;

  @ApiPropertyOptional({
    type: String,
    default: TRANSLATION_DEFAULT_TARGET_LANGUAGE,
    description: 'Trimmed and lowercased before format validation.',
    pattern: TRANSLATION_LANGUAGE_CODE_PATTERN.source,
  })
  @Matches(TRANSLATION_LANGUAGE_CODE_PATTERN)
  @TrimToLowerCase()
  targetLanguage = TRANSLATION_DEFAULT_TARGET_LANGUAGE;

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
