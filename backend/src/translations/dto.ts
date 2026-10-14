import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { Trim, TrimToLowerCase } from '../common/validation/transforms';

const LANGUAGE_CODE_PATTERN = /^[a-z]{2,10}$/;

export class TranslateWordDto {
  @IsOptional()
  @IsString()
  @MaxLength(4_000)
  @Trim()
  context?: string;

  @Matches(LANGUAGE_CODE_PATTERN)
  @TrimToLowerCase()
  sourceLanguage = 'en';

  @Matches(LANGUAGE_CODE_PATTERN)
  @TrimToLowerCase()
  targetLanguage = 'uk';

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  @Trim()
  word!: string;
}
