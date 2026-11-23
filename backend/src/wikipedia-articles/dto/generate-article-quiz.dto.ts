import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  Trim,
  TrimToLowerCase,
  TrimToUpperCase,
} from '../../common/validation/transforms';
import {
  type ArticleSimplificationLevel,
  type ArticleSimplificationTargetLength,
} from '../contracts/types';
import {
  SIMPLIFICATION_LEVELS,
  ARTICLE_TARGET_LENGTHS,
  ARTICLE_TEXT_MAX_LENGTH,
  ARTICLE_TITLE_MAX_LENGTH,
} from '../contracts/constants';

const requestSchema = {
  name: 'GenerateArticleQuizRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class GenerateArticleQuizDto {
  @ApiProperty({
    enum: SIMPLIFICATION_LEVELS,
    enumName: 'ArticleSimplificationLevel',
    description: 'Strings are trimmed and normalized before validation.',
  })
  @IsIn(SIMPLIFICATION_LEVELS)
  @TrimToUpperCase()
  declare level: ArticleSimplificationLevel;

  @ApiProperty({
    enum: ARTICLE_TARGET_LENGTHS,
    enumName: 'ArticleSimplificationTargetLength',
    description: 'Strings are trimmed and normalized before validation.',
  })
  @IsIn(ARTICLE_TARGET_LENGTHS)
  @TrimToLowerCase()
  declare targetLength: ArticleSimplificationTargetLength;

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
