import { ARTICLE_EXCLUSION_IDS_MAX_COUNT } from '../contracts/constants';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  ToBoolean,
  ToUniquePositiveIntegerArray,
  Trim,
  TrimToLowerCase,
  TrimToUpperCase,
} from '../../common/validation/transforms';
import {
  type ArticleReadyLevelFilter,
  type ArticleReadyTransformationFilter,
  type WikipediaArticleCategory,
  type WikipediaArticlePreviewLength,
  type WikipediaArticleSortOption,
} from '../contracts/types';
import {
  ARTICLE_CATEGORIES,
  ARTICLE_PREVIEW_LENGTHS,
  ARTICLE_SORT_OPTIONS,
  ARTICLE_READY_LEVELS,
  ARTICLE_READY_TRANSFORMATIONS,
} from '../contracts/constants';
import { RandomArticlesQueryDto } from './random-articles-query.dto';

const ARTICLE_SEARCH_MAX_LENGTH = 500;

const requestSchema = {
  name: 'FetchWikipediaArticlesParams',
  additionalProperties: false,
};

@ApiSchema(requestSchema)
export class ArticleListQueryDto extends RandomArticlesQueryDto {
  @ApiPropertyOptional({
    enum: ARTICLE_CATEGORIES,
    enumName: 'WikipediaArticleCategory',
    description: 'Strings are trimmed and normalized before validation.',
  })
  @IsIn(ARTICLE_CATEGORIES)
  @IsOptional()
  @TrimToLowerCase()
  category?: WikipediaArticleCategory;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'integer', minimum: 1 },
    maxItems: ARTICLE_EXCLUSION_IDS_MAX_COUNT,
    description:
      'Comma-separated positive integers, deduplicated before validation. Empty input is omitted; repeated string query values fail validation.',
  })
  @ArrayMaxSize(ARTICLE_EXCLUSION_IDS_MAX_COUNT)
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  @Min(1, { each: true })
  @ToUniquePositiveIntegerArray()
  excludeIds?: number[];

  @ApiPropertyOptional({
    enum: ARTICLE_PREVIEW_LENGTHS,
    enumName: 'WikipediaArticlePreviewLength',
    description: 'Strings are trimmed and normalized before validation.',
  })
  @IsIn(ARTICLE_PREVIEW_LENGTHS)
  @IsOptional()
  @TrimToLowerCase()
  previewLength?: WikipediaArticlePreviewLength;

  @ApiPropertyOptional({ type: 'boolean' })
  @IsBoolean()
  @IsOptional()
  @ToBoolean()
  preferImagesFirst?: boolean;

  @ApiPropertyOptional({
    enum: ARTICLE_READY_LEVELS,
    enumName: 'ArticleReadyLevelFilter',
    description: 'Strings are trimmed and normalized before validation.',
  })
  @IsIn(ARTICLE_READY_LEVELS)
  @IsOptional()
  @TrimToUpperCase()
  readyLevel?: ArticleReadyLevelFilter;

  @ApiPropertyOptional({
    enum: ARTICLE_READY_TRANSFORMATIONS,
    enumName: 'ArticleReadyTransformationFilter',
    description: 'Strings are trimmed and normalized before validation.',
  })
  @IsIn(ARTICLE_READY_TRANSFORMATIONS)
  @IsOptional()
  @TrimToLowerCase()
  readyTransformationType?: ArticleReadyTransformationFilter;

  @ApiPropertyOptional({ type: 'boolean' })
  @IsBoolean()
  @IsOptional()
  @ToBoolean()
  recommended?: boolean;

  @ApiPropertyOptional({
    type: 'string',
    maxLength: ARTICLE_SEARCH_MAX_LENGTH,
    description: 'Strings are trimmed and normalized before validation.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(ARTICLE_SEARCH_MAX_LENGTH)
  @Trim()
  search?: string;

  @ApiPropertyOptional({
    enum: ARTICLE_SORT_OPTIONS,
    enumName: 'WikipediaArticleSortOption',
    description: 'Strings are trimmed and normalized before validation.',
  })
  @IsIn(ARTICLE_SORT_OPTIONS)
  @IsOptional()
  @TrimToLowerCase()
  sortBy?: WikipediaArticleSortOption;
}
