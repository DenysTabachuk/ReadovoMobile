import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  Trim,
  TrimToLowerCase,
  TrimToUpperCase,
} from '../../common/validation/transforms';
import {
  type ArticleBlock,
  type ArticleSimplificationLevel,
  type ArticleTextTransformationType,
} from '../contracts/types';
import {
  SIMPLIFICATION_LEVELS,
  TRANSFORMATION_TYPES,
  ARTICLE_TEXT_MAX_LENGTH,
  ARTICLE_TITLE_MAX_LENGTH,
} from '../contracts/constants';

const requestSchema = {
  name: 'SimplifyArticleRequest',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class SimplifyArticleDto {
  @ApiPropertyOptional({ type: 'integer', minimum: 1, nullable: true })
  @IsInt()
  @IsOptional()
  @Min(1)
  articleId?: number;

  @ApiPropertyOptional({
    type: 'array',
    items: {},
    description:
      'Optional source blocks. Only the array container is DTO-validated; nested block data is not validated at this boundary.',
    nullable: true,
  })
  @IsArray()
  @IsOptional()
  blocks?: ArticleBlock[];

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

  @ApiPropertyOptional({
    type: String,
    enum: [...TRANSFORMATION_TYPES, null],
    nullable: true,
    description: 'Strings are trimmed and normalized before validation.',
  })
  @IsIn(TRANSFORMATION_TYPES)
  @IsOptional()
  @TrimToLowerCase()
  transformationType?: ArticleTextTransformationType;
}
