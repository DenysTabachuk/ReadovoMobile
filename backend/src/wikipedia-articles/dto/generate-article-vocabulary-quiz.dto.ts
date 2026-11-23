import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Trim, TrimToUpperCase } from '../../common/validation/transforms';
import { type ArticleSimplificationLevel } from '../contracts/types';
import {
  SIMPLIFICATION_LEVELS,
  ARTICLE_TEXT_MAX_LENGTH,
  ARTICLE_TITLE_MAX_LENGTH,
} from '../contracts/constants';

const requestSchema = {
  name: 'GenerateArticleVocabularyQuizRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class GenerateArticleVocabularyQuizDto {
  @ApiPropertyOptional({
    type: String,
    enum: [...SIMPLIFICATION_LEVELS, null],
    nullable: true,
    description: 'Strings are trimmed and normalized before validation.',
  })
  @IsIn(SIMPLIFICATION_LEVELS)
  @IsOptional()
  @TrimToUpperCase()
  level?: ArticleSimplificationLevel;

  @ApiProperty({
    type: 'string',
    maxLength: ARTICLE_TEXT_MAX_LENGTH,
    minLength: 1,
    description: 'Strings are trimmed and normalized before validation.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(ARTICLE_TEXT_MAX_LENGTH)
  @Trim()
  declare text: string;

  @ApiPropertyOptional({
    type: 'string',
    maxLength: ARTICLE_TITLE_MAX_LENGTH,
    nullable: true,
    description: 'Strings are trimmed and normalized before validation.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(ARTICLE_TITLE_MAX_LENGTH)
  @Trim()
  title?: string;
}
