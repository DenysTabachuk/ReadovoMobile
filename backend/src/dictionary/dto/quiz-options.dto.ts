import { DICTIONARY_WORD_MAX_LENGTH } from '../constants';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Trim } from '../../common/validation/transforms';

import {
  MAX_DICTIONARY_WORD_LIST_SIZE,
  NON_BLANK_DICTIONARY_TEXT_PATTERN,
} from '../constants';

const requestSchema = {
  name: 'DictionaryQuizOptionsRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class QuizOptionsDto {
  @ApiProperty({
    type: String,
    minLength: 1,
    maxLength: DICTIONARY_WORD_MAX_LENGTH,
    description: 'Trimmed correct word.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(DICTIONARY_WORD_MAX_LENGTH)
  @Trim()
  declare correctWord: string;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      pattern: NON_BLANK_DICTIONARY_TEXT_PATTERN.source,
    },
    maxItems: MAX_DICTIONARY_WORD_LIST_SIZE,
    nullable: true,
    description:
      'Omitted, null or empty lists use no candidates. Candidates must contain non-whitespace text.',
  })
  @ArrayMaxSize(MAX_DICTIONARY_WORD_LIST_SIZE)
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @Matches(NON_BLANK_DICTIONARY_TEXT_PATTERN, { each: true })
  wordList?: string[] | null;
}
