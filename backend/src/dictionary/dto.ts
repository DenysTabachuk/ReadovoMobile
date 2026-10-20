import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { ToNumber, Trim } from '../common/validation/transforms';
import { type DictionaryWordProgress } from './types';

const MAX_WORD_LIST_SIZE = 1_000;

export class DictionaryWordParamsDto {
  @IsUUID()
  @Trim()
  wordId!: string;
}

export class CreateDictionaryWordDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(4_000)
  @Trim()
  context!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  @Trim()
  translation!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  @Trim()
  word!: string;
}

export class UpdateDictionaryWordProgressDto {
  @IsIn(['in_progress'])
  progress!: Extract<DictionaryWordProgress, 'in_progress'>;
}

export class GenerateEmbeddingDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(4_000)
  @Trim()
  text!: string;
}

export class SimilarWordsDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  @Trim()
  word!: string;

  @ArrayMaxSize(MAX_WORD_LIST_SIZE)
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  wordList?: string[];
}

export class QuizOptionsDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  @Trim()
  correctWord!: string;

  @ArrayMaxSize(MAX_WORD_LIST_SIZE)
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  wordList?: string[];
}

export class SubmitDictionaryTestAnswerDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  @Trim()
  selectedOptionId!: string;

  @IsUUID()
  @Trim()
  wordId!: string;
}

export class DictionaryTestQueryDto {
  @IsInt()
  @Max(10)
  @Min(1)
  @ToNumber()
  limit = 10;
}
