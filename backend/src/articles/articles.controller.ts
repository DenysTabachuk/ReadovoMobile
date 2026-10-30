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
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { QuizService } from '../quiz/quiz.service';
import {
  ArticleAdaptationsQueryDto,
  ArticleDetailQueryDto,
  ArticleIdParamsDto,
  ArticleListQueryDto,
  GenerateArticleQuizDto,
  GenerateArticleVocabularyQuizDto,
  RandomArticlesQueryDto,
  SimplifyArticleDto,
  SavedArticleIdParamsDto,
  WikipediaArticleDto,
} from './contracts/dto';
import { ArticlesService } from './articles.service';
import { randomizeQuizOptions } from './quiz/utils/randomizeQuizOptions';
import {
  type ArticleAdaptationsByArticleId,
  type UserRecentArticle,
  type UserSavedArticle,
  type SimplifyArticleResponse,
  type WikipediaArticle,
  type WikipediaArticleDetail,
} from './contracts/types';

@Controller()
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly quiz: QuizService,
  ) {}

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

  @Get('api/users/me/articles/saved')
  @UseGuards(UserAuthGuard)
  async getSavedArticles(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserSavedArticle[]> {
    return this.articlesService.getSavedArticles(user.id);
  }

  @Post('api/users/me/articles/saved')
  @UseGuards(UserAuthGuard)
  async saveArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: WikipediaArticleDto,
  ): Promise<UserSavedArticle[]> {
    return this.articlesService.saveArticleForUser(user.id, body);
  }

  @Delete('api/users/me/articles/saved/:articleId')
  @UseGuards(UserAuthGuard)
  async removeSavedArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { articleId }: SavedArticleIdParamsDto,
  ): Promise<UserSavedArticle[]> {
    return this.articlesService.removeSavedArticleForUser(user.id, articleId);
  }

  @Get('api/users/me/articles/recent')
  @UseGuards(UserAuthGuard)
  async getRecentArticles(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserRecentArticle[]> {
    return this.articlesService.getRecentArticles(user.id);
  }

  @Post('api/users/me/articles/recent')
  @UseGuards(UserAuthGuard)
  async recordRecentArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: WikipediaArticleDto,
  ): Promise<UserRecentArticle[]> {
    return this.articlesService.recordRecentArticleForUser(user.id, body);
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
  @UseGuards(UserAuthGuard)
  async generateArticleQuiz(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: GenerateArticleQuizDto,
  ) {
    const generatedQuestions =
      await this.articlesService.generateArticleQuiz(body);
    const questions = generatedQuestions.map(randomizeQuizOptions);

    const sessionId = await this.quiz.create(user.id, {
      kind: 'article',
      level: body.level,
      targetLength: body.targetLength,
      questions: questions.map((question) => ({
        id: question.id,
        type: question.type,
        optionIds: question.options.map((option) => option.id),
        correctOptionIds: question.correctOptionIds,
        explanation: question.explanation,
      })),
    });
    return {
      sessionId,
      questions: questions.map((question) => ({
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        options: question.options,
      })),
    };
  }

  @Post('api/articles/vocabulary-quiz')
  @UseGuards(UserAuthGuard)
  async generateArticleVocabularyQuiz(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: GenerateArticleVocabularyQuizDto,
  ) {
    const result =
      await this.articlesService.generateArticleVocabularyQuiz(body);
    const questions = result.questions.map(randomizeQuizOptions);
    const sessionId = await this.quiz.create(user.id, {
      kind: 'vocabulary',
      level: result.resolvedLevel,
      targetLength: 'medium',
      questions: questions.map((question) => ({
        id: question.id,
        type: question.type,
        optionIds: question.options.map((option) => option.id),
        correctOptionIds: question.correctOptionIds,
        explanation: question.explanation,
        vocabularyWord: {
          term: question.term,
          translation: question.translation,
          sourceExcerpt: question.sourceExcerpt,
        },
      })),
    });
    return {
      sessionId,
      resolvedLevel: result.resolvedLevel,
      questions: questions.map((question) => ({
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        options: question.options,
        format: question.format,
        termKind: question.termKind,
      })),
    };
  }
}
