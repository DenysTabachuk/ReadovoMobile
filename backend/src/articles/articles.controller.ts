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
  type SimplifyArticleRequest,
  type SimplifyArticleResponse,
  type WikipediaArticle,
  type WikipediaArticleDetail,
} from './types';

const DEFAULT_TARGET_LENGTH: ArticleSimplificationTargetLength = 'short';
const SIMPLIFICATION_LEVELS: ArticleSimplificationLevel[] = [
  'A1',
  'A2',
  'B1',
  'B2',
];
const TARGET_LENGTHS: ArticleSimplificationTargetLength[] = ['short', 'medium'];

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
}
