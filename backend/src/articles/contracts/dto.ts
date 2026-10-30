import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  ToBoolean,
  ToNumber,
  ToUniquePositiveIntegerArray,
  Trim,
  TrimToLowerCase,
  TrimToUpperCase,
} from '../../common/validation/transforms';
import { UserIdParamsDto } from '../../common/validation/request.dto';
import {
  type ArticleBlock,
  type ArticleReadyLevelFilter,
  type ArticleReadyTransformationFilter,
  type ArticleSimplificationLevel,
  type ArticleSimplificationTargetLength,
  type ArticleTextTransformationType,
  type WikipediaArticleCategory,
  type WikipediaArticlePreviewLength,
  type WikipediaArticleSortOption,
} from './types';

const ARTICLE_CATEGORIES: WikipediaArticleCategory[] = [
  'all',
  'biography',
  'culture',
  'food',
  'geography',
  'history',
  'nature',
  'science',
  'space',
  'sports',
  'technology',
];
const SIMPLIFICATION_LEVELS: ArticleSimplificationLevel[] = [
  'A1',
  'A2',
  'B1',
  'B2',
  'C1',
];
const TRANSFORMATION_TYPES: ArticleTextTransformationType[] = [
  'adaptation',
  'summary',
];

export class RandomArticlesQueryDto {
  @IsInt()
  @IsOptional()
  @Max(50)
  @Min(1)
  @ToNumber()
  limit?: number;
}

export class ArticleListQueryDto extends RandomArticlesQueryDto {
  @IsIn(ARTICLE_CATEGORIES)
  @IsOptional()
  @TrimToLowerCase()
  category?: WikipediaArticleCategory;

  @ArrayMaxSize(50)
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  @Min(1, { each: true })
  @ToUniquePositiveIntegerArray()
  excludeIds?: number[];

  @IsIn(['all', 'short', 'medium', 'long'])
  @IsOptional()
  @TrimToLowerCase()
  previewLength?: WikipediaArticlePreviewLength;

  @IsBoolean()
  @IsOptional()
  @ToBoolean()
  preferImagesFirst?: boolean;

  @IsIn(['all', 'A1', 'A2', 'B1', 'B2'])
  @IsOptional()
  @TrimToUpperCase()
  readyLevel?: ArticleReadyLevelFilter;

  @IsIn(['all', 'adaptation', 'summary', 'both'])
  @IsOptional()
  @TrimToLowerCase()
  readyTransformationType?: ArticleReadyTransformationFilter;

  @IsBoolean()
  @IsOptional()
  @ToBoolean()
  recommended?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Trim()
  search?: string;

  @IsIn(['default', 'length_desc', 'length_asc'])
  @IsOptional()
  @TrimToLowerCase()
  sortBy?: WikipediaArticleSortOption;
}

export class ArticleAdaptationsQueryDto {
  @ArrayMaxSize(100)
  @ArrayNotEmpty()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @ToUniquePositiveIntegerArray()
  articleIds!: number[];

  @IsIn(['all', ...TRANSFORMATION_TYPES])
  @IsOptional()
  @TrimToLowerCase()
  transformationType?: ArticleTextTransformationType | 'all';
}

export class ArticleIdParamsDto {
  @IsInt()
  @Min(1)
  @ToNumber()
  id!: number;
}

export class ArticleDetailQueryDto {
  @IsIn(['en'])
  @TrimToLowerCase()
  languageCode = 'en';
}

export class UserArticleIdParamsDto extends UserIdParamsDto {
  @IsInt()
  @Min(1)
  @ToNumber()
  articleId!: number;
}

class ArticleAdaptationSummaryDto {
  @IsIn(SIMPLIFICATION_LEVELS)
  level!: ArticleSimplificationLevel;

  @IsIn(TRANSFORMATION_TYPES)
  transformationType!: ArticleTextTransformationType;
}

export class WikipediaArticleDto {
  @IsArray()
  @IsOptional()
  @Type(() => ArticleAdaptationSummaryDto)
  @ValidateNested({ each: true })
  availableAdaptations?: ArticleAdaptationSummaryDto[];

  @IsString()
  extract!: string;

  @IsInt()
  @Min(1)
  id!: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  pageLength?: number;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  thumbnailUrl?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  @Trim()
  title!: string;

  @IsUrl({ require_protocol: true })
  url!: string;
}

export class SimplifyArticleDto {
  @IsInt()
  @IsOptional()
  @Min(1)
  articleId?: number;

  @IsArray()
  @IsOptional()
  blocks?: ArticleBlock[];

  @IsIn(SIMPLIFICATION_LEVELS)
  @IsOptional()
  @TrimToUpperCase()
  level?: ArticleSimplificationLevel;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2_000_000)
  @Trim()
  text!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Trim()
  title?: string;

  @IsIn(TRANSFORMATION_TYPES)
  @IsOptional()
  @TrimToLowerCase()
  transformationType?: ArticleTextTransformationType;
}

export class GenerateArticleQuizDto {
  @IsIn(SIMPLIFICATION_LEVELS)
  @TrimToUpperCase()
  level!: ArticleSimplificationLevel;

  @IsIn(['short', 'medium', 'long'])
  @TrimToLowerCase()
  targetLength!: ArticleSimplificationTargetLength;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2_000_000)
  @Trim()
  text!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Trim()
  title?: string;
}

export class GenerateArticleVocabularyQuizDto {
  @IsIn(SIMPLIFICATION_LEVELS)
  @IsOptional()
  @TrimToUpperCase()
  level?: ArticleSimplificationLevel;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2_000_000)
  @Trim()
  text!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Trim()
  title?: string;
}
