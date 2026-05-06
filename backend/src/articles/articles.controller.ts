import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { ArticlesService } from './articles.service';
import {
  type ArticleSimplificationLevel,
  type ArticleSimplificationTargetLength,
  type GenerateArticleQuizRequest,
  type ArticleQuizQuestion,
  type SimplifyArticleRequest,
  type SimplifyArticleResponse,
  type WikipediaArticle,
  type WikipediaArticleCategory,
  type WikipediaArticlePreviewLength,
  type WikipediaArticleDetail,
} from './types';

const DEFAULT_TARGET_LENGTH: ArticleSimplificationTargetLength = 'short';
const SIMPLIFICATION_LEVELS: ArticleSimplificationLevel[] = [
  'A1',
  'A2',
  'B1',
  'B2',
];
const ARTICLE_CATEGORIES: WikipediaArticleCategory[] = [
  'all',
  'biography',
  'food',
  'geography',
  'history',
  'space',
  'sports',
  'science',
  'technology',
  'nature',
  'culture',
];
const TARGET_LENGTHS: ArticleSimplificationTargetLength[] = [
  'short',
  'medium',
  'long',
];
const PREVIEW_LENGTHS: WikipediaArticlePreviewLength[] = [
  'all',
  'short',
  'medium',
  'long',
];

@Controller()
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get('articles/random')
  async getRandomArticles(
    @Query('limit') limit?: string,
  ): Promise<WikipediaArticle[]> {
    if (limit === undefined) {
      return this.articlesService.getRandomArticles();
    }

    const parsedLimit = Number(limit);

    if (!Number.isFinite(parsedLimit)) {
      throw new BadRequestException('Article limit must be a number.');
    }

    return this.articlesService.getRandomArticles(parsedLimit);
  }

  @Get('articles')
  async getArticles(
    @Query('category') category?: string,
    @Query('excludeIds') excludeIds?: string,
    @Query('limit') limit?: string,
    @Query('previewLength') previewLength?: string,
    @Query('recommended') recommended?: string,
    @Query('search') search?: string,
  ): Promise<WikipediaArticle[]> {
    const parsedLimit = limit === undefined ? undefined : Number(limit);
    const normalizedCategory = category?.trim().toLowerCase() as
      | WikipediaArticleCategory
      | undefined;
    const normalizedPreviewLength = previewLength?.trim().toLowerCase() as
      | WikipediaArticlePreviewLength
      | undefined;
    const normalizedRecommended = recommended?.trim().toLowerCase();
    const parsedExcludeIds = this.parseExcludeIds(excludeIds);

    if (limit !== undefined && !Number.isFinite(parsedLimit)) {
      throw new BadRequestException('Article limit must be a number.');
    }

    if (
      normalizedCategory !== undefined &&
      !ARTICLE_CATEGORIES.includes(normalizedCategory)
    ) {
      throw new BadRequestException('Article category is invalid.');
    }

    if (
      normalizedPreviewLength !== undefined &&
      !PREVIEW_LENGTHS.includes(normalizedPreviewLength)
    ) {
      throw new BadRequestException('Preview length is invalid.');
    }

    if (
      normalizedRecommended !== undefined &&
      normalizedRecommended !== 'true' &&
      normalizedRecommended !== 'false'
    ) {
      throw new BadRequestException('Recommended flag is invalid.');
    }

    return this.articlesService.getArticles({
      category: normalizedCategory,
      excludeIds: parsedExcludeIds,
      limit: parsedLimit,
      previewLength: normalizedPreviewLength,
      recommended:
        normalizedRecommended === undefined
          ? undefined
          : normalizedRecommended === 'true',
      search,
    });
  }

  private parseExcludeIds(excludeIds?: string): number[] | undefined {
    if (!excludeIds?.trim()) {
      return undefined;
    }

    const parsedIds = excludeIds
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (parsedIds.length === 0) {
      throw new BadRequestException('Excluded article ids are invalid.');
    }

    return Array.from(new Set(parsedIds));
  }

  @Get('articles/:id')
  async getArticleDetail(
    @Param('id') id: string,
  ): Promise<WikipediaArticleDetail> {
    const pageId = Number(id);

    if (!Number.isInteger(pageId) || pageId <= 0) {
      throw new BadRequestException('Article id must be a positive integer.');
    }

    return this.articlesService.getArticleDetail(pageId);
  }

  @Post('api/articles/simplify')
  async simplifyArticle(
    @Body() body: SimplifyArticleRequest,
  ): Promise<SimplifyArticleResponse> {
    const text = body.text?.trim();
    const title = body.title?.trim();
    const level = body.level?.trim().toUpperCase() as
      | ArticleSimplificationLevel
      | undefined;
    const targetLength = body.targetLength?.trim().toLowerCase() as
      | ArticleSimplificationTargetLength
      | undefined;

    if (!text) {
      throw new BadRequestException('Article text is required.');
    }

    if (level && !SIMPLIFICATION_LEVELS.includes(level)) {
      throw new BadRequestException('Article level is invalid.');
    }

    if (targetLength && !TARGET_LENGTHS.includes(targetLength)) {
      throw new BadRequestException('Target length is invalid.');
    }

    return this.articlesService.simplifyArticle({
      level,
      targetLength: targetLength ?? DEFAULT_TARGET_LENGTH,
      text,
      title,
    });
  }

  @Post('api/articles/quiz')
  async generateArticleQuiz(
    @Body() body: GenerateArticleQuizRequest,
  ): Promise<{ questions: ArticleQuizQuestion[] }> {
    const text = body.text?.trim();
    const title = body.title?.trim();
    const level = body.level?.trim().toUpperCase() as
      | ArticleSimplificationLevel
      | undefined;
    const targetLength = body.targetLength?.trim().toLowerCase() as
      | ArticleSimplificationTargetLength
      | undefined;

    if (!text) {
      throw new BadRequestException('Article text is required.');
    }

    if (level && !SIMPLIFICATION_LEVELS.includes(level)) {
      throw new BadRequestException('Article level is invalid.');
    }

    if (targetLength && !TARGET_LENGTHS.includes(targetLength)) {
      throw new BadRequestException('Target length is invalid.');
    }

    const questions = await this.articlesService.generateArticleQuiz({
      level,
      targetLength: targetLength ?? DEFAULT_TARGET_LENGTH,
      text,
      title,
    });

    return { questions };
  }
}
