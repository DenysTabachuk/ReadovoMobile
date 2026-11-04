import { DICTIONARY_WORD_MAX_LENGTH } from '../constants';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Trim } from '../../common/validation/transforms';

const DICTIONARY_CONTEXT_MAX_LENGTH = 4000;
const DICTIONARY_TRANSLATION_MAX_LENGTH = 500;

const requestSchema = {
  name: 'CreateDictionaryWordRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class CreateDictionaryWordDto {
  @ApiProperty({
    type: String,
    minLength: 1,
    maxLength: DICTIONARY_CONTEXT_MAX_LENGTH,
    description: 'Trimmed context.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(DICTIONARY_CONTEXT_MAX_LENGTH)
  @Trim()
  declare context: string;

  @ApiProperty({
    type: String,
    minLength: 1,
    maxLength: DICTIONARY_TRANSLATION_MAX_LENGTH,
    description: 'Trimmed translation.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(DICTIONARY_TRANSLATION_MAX_LENGTH)
  @Trim()
  declare translation: string;

  @ApiProperty({
    type: String,
    minLength: 1,
    maxLength: DICTIONARY_WORD_MAX_LENGTH,
    description: 'Trimmed word or phrase.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(DICTIONARY_WORD_MAX_LENGTH)
  @Trim()
  declare word: string;
}
