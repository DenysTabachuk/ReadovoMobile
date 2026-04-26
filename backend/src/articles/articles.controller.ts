import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';

import { ArticlesService } from './articles.service';
import {
  type WikipediaArticle,
  type WikipediaArticleDetail,
} from './types';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get('random')
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

  @Get(':id')
  async getArticleDetail(@Param('id') id: string): Promise<WikipediaArticleDetail> {
    const pageId = Number(id);

    if (!Number.isInteger(pageId) || pageId <= 0) {
      throw new BadRequestException('Article id must be a positive integer.');
    }

    return this.articlesService.getArticleDetail(pageId);
  }
}
