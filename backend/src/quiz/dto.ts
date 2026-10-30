import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsTimeZone,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Trim } from '../common/validation/transforms';

export class QuizSessionParamsDto {
  @IsUUID()
  sessionId!: string;
}

export class SubmitQuizAnswerDto {
  @IsString()
  @MaxLength(200)
  questionId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  selectedOptionIds!: string[];
}

export class CompleteQuizDto {
  @IsOptional()
  @IsTimeZone()
  @Trim()
  timezone?: string;
}
