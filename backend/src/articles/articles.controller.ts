import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UserAuthGuard } from '../auth/user-auth.guard';
import { UserIdParamsDto } from '../common/validation/request.dto';
import {
  ArticleAdaptationsQueryDto,
  ArticleDetailQueryDto,
  ArticleIdParamsDto,
  ArticleListQueryDto,
  GenerateArticleQuizDto,
  GenerateArticleVocabularyQuizDto,
  RandomArticlesQueryDto,
  SimplifyArticleDto,
  UserArticleIdParamsDto,
  WikipediaArticleDto,
} from './contracts/dto';
import { ArticlesService } from './articles.service';
import {
  type ArticleSimplificationTargetLength,
  type ArticleAdaptationsByArticleId,
  type GenerateArticleVocabularyQuizResponse,
  type UserRecentArticle,
  type UserSavedArticle,
  type ArticleQuizQuestion,
  type SimplifyArticleResponse,
  type WikipediaArticle,
  type WikipediaArticleDetail,
} from './contracts/types';

const DEFAULT_TARGET_LENGTH: ArticleSimplificationTargetLength = 'short';
@Controller()
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get('articles/random')
  async getRandomArticles(
    @Query() { limit }: RandomArticlesQueryDto,
  ): Promise<WikipediaArticle[]> {
    return this.articlesService.getRandomArticles(limit);
  }

  @Get('articles')
  async getArticles(
    @Query() query: ArticleListQueryDto,
  ): Promise<WikipediaArticle[]> {
    return this.articlesService.getArticles(query);
  }

  @Get('api/articles/adaptations')
  async getArticleAdaptations(
    @Query() query: ArticleAdaptationsQueryDto,
  ): Promise<ArticleAdaptationsByArticleId> {
    return this.articlesService.getAvailableAdaptationsByArticleIds(
      query.articleIds,
      query.transformationType,
    );
  }

  @Get('api/users/:userId/articles/saved')
  @UseGuards(UserAuthGuard)
  async getSavedArticles(
    @Param() { userId }: UserIdParamsDto,
  ): Promise<UserSavedArticle[]> {
    return this.articlesService.getSavedArticles(userId);
  }

  @Post('api/users/:userId/articles/saved')
  @UseGuards(UserAuthGuard)
  async saveArticle(
    @Param() { userId }: UserIdParamsDto,
    @Body() body: WikipediaArticleDto,
  ): Promise<UserSavedArticle[]> {
    return this.articlesService.saveArticleForUser(userId, body);
  }

  @Delete('api/users/:userId/articles/saved/:articleId')
  @UseGuards(UserAuthGuard)
  async removeSavedArticle(
    @Param() { articleId, userId }: UserArticleIdParamsDto,
  ): Promise<UserSavedArticle[]> {
    return this.articlesService.removeSavedArticleForUser(userId, articleId);
  }

  @Get('api/users/:userId/articles/recent')
  @UseGuards(UserAuthGuard)
  async getRecentArticles(
    @Param() { userId }: UserIdParamsDto,
  ): Promise<UserRecentArticle[]> {
    return this.articlesService.getRecentArticles(userId);
  }

  @Post('api/users/:userId/articles/recent')
  @UseGuards(UserAuthGuard)
  async recordRecentArticle(
    @Param() { userId }: UserIdParamsDto,
    @Body() body: WikipediaArticleDto,
  ): Promise<UserRecentArticle[]> {
    return this.articlesService.recordRecentArticleForUser(userId, body);
  }

  @Get('articles/:id')
  async getArticleDetail(
    @Param() { id }: ArticleIdParamsDto,
    @Query() query: ArticleDetailQueryDto,
  ): Promise<WikipediaArticleDetail> {
    return this.articlesService.getArticleDetail(id, query.languageCode);
  }

  @Post('api/articles/simplify')
  async simplifyArticle(
    @Body() body: SimplifyArticleDto,
  ): Promise<SimplifyArticleResponse> {
    return this.articlesService.simplifyArticle(body);
  }

  @Post('api/articles/quiz')
  async generateArticleQuiz(
    @Body() body: GenerateArticleQuizDto,
  ): Promise<{ questions: ArticleQuizQuestion[] }> {
    const questions = await this.articlesService.generateArticleQuiz({
      ...body,
      targetLength: body.targetLength ?? DEFAULT_TARGET_LENGTH,
    });

    return { questions };
  }

  @Post('api/articles/vocabulary-quiz')
  async generateArticleVocabularyQuiz(
    @Body() body: GenerateArticleVocabularyQuizDto,
  ): Promise<GenerateArticleVocabularyQuizResponse> {
    return this.articlesService.generateArticleVocabularyQuiz(body);
  }
}
