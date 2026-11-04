import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { ApiUserAuth } from '../auth/api-user-auth.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import {
  ARTICLE_EXCLUSION_IDS_MAX_COUNT,
  ARTICLE_ADAPTATION_IDS_MAX_COUNT,
} from './contracts/constants';
import { ARTICLES_ERRORS } from './articles-errors';
import { WikipediaArticleResponseDto } from './dto/wikipedia-article-response.dto';
import { WikipediaArticleDetailResponseDto } from './dto/get-wikipedia-article-detail-response.dto';
import { UserSavedArticleResponseDto } from './dto/get-saved-articles-response.dto';
import { UserRecentArticleResponseDto } from './dto/get-recent-articles-response.dto';
import { ArticleAdaptationsResponseDto } from './dto/get-article-adaptations-response.dto';
import { SimplifyArticleResponseDto } from './dto/simplify-article-response.dto';
import { GenerateArticleQuizResponseDto } from './dto/generate-article-quiz-response.dto';
import { GenerateArticleVocabularyQuizResponseDto } from './dto/generate-article-vocabulary-quiz-response.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { QuizService } from '../quiz/quiz.service';
import { ArticleAdaptationsQueryDto } from './dto/article-adaptations-query.dto';
import { ArticleDetailQueryDto } from './dto/article-detail-query.dto';
import { ArticleIdParamsDto } from './dto/article-id-params.dto';
import { ArticleListQueryDto } from './dto/article-list-query.dto';
import { GenerateArticleQuizDto } from './dto/generate-article-quiz.dto';
import { GenerateArticleVocabularyQuizDto } from './dto/generate-article-vocabulary-quiz.dto';
import { RandomArticlesQueryDto } from './dto/random-articles-query.dto';
import { SimplifyArticleDto } from './dto/simplify-article.dto';
import { SavedArticleIdParamsDto } from './dto/saved-article-id-params.dto';
import { WikipediaArticleDto } from './dto/save-article.dto';
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

@ApiTags('Articles')
@ApiExtraModels(
  ArticleListQueryDto,
  ArticleAdaptationsQueryDto,
  ArticleDetailQueryDto,
)
@Controller()
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly quiz: QuizService,
  ) {}

  @Get('articles/random')
  @ApiOperation({ operationId: 'getRandomWikipediaArticles', security: [] })
  @ApiOkResponse({ type: [WikipediaArticleResponseDto] })
  @ApiErrorResponses({
    validation: true,
    errors: [
      ARTICLES_ERRORS.WIKIPEDIA_REQUEST_FAILED,
      ARTICLES_ERRORS.WIKIPEDIA_INVALID_RESPONSE,
    ],
  })
  async getRandomArticles(
    @Query() { limit }: RandomArticlesQueryDto,
  ): Promise<WikipediaArticle[]> {
    return this.articlesService.getRandomArticles(limit);
  }

  @Get('articles')
  @ApiQuery({
    name: 'excludeIds',
    required: false,
    style: 'form',
    explode: false,
    schema: {
      type: 'array',
      items: { type: 'integer', minimum: 1 },
      maxItems: ARTICLE_EXCLUSION_IDS_MAX_COUNT,
    },
  })
  @ApiOperation({ operationId: 'getWikipediaArticles', security: [] })
  @ApiOkResponse({ type: [WikipediaArticleResponseDto] })
  @ApiErrorResponses({
    validation: true,
    errors: [
      ARTICLES_ERRORS.WIKIPEDIA_REQUEST_FAILED,
      ARTICLES_ERRORS.WIKIPEDIA_INVALID_RESPONSE,
    ],
  })
  async getArticles(
    @Query() query: ArticleListQueryDto,
  ): Promise<WikipediaArticle[]> {
    return this.articlesService.getArticles(query);
  }

  @Get('api/articles/adaptations')
  @ApiQuery({
    name: 'articleIds',
    required: true,
    style: 'form',
    explode: false,
    schema: {
      type: 'array',
      items: { type: 'integer', minimum: 1 },
      maxItems: ARTICLE_ADAPTATION_IDS_MAX_COUNT,
      minItems: 1,
    },
  })
  @ApiOperation({ operationId: 'getArticleAdaptations', security: [] })
  @ApiOkResponse({ type: ArticleAdaptationsResponseDto })
  @ApiErrorResponses({ validation: true, errors: [] })
  async getArticleAdaptations(
    @Query() query: ArticleAdaptationsQueryDto,
  ): Promise<ArticleAdaptationsByArticleId> {
    return this.articlesService.getAvailableAdaptationsByArticleIds(
      query.articleIds,
      query.transformationType,
    );
  }

  @Get('api/users/me/articles/saved')
  @ApiOperation({ operationId: 'getSavedArticles' })
  @ApiOkResponse({ type: [UserSavedArticleResponseDto] })
  @ApiUserAuth({ validation: false, errors: [ARTICLES_ERRORS.USER_NOT_FOUND] })
  async getSavedArticles(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserSavedArticle[]> {
    return this.articlesService.getSavedArticles(user.id);
  }

  @Post('api/users/me/articles/saved')
  @ApiOperation({ operationId: 'saveArticleForLater' })
  @ApiCreatedResponse({ type: [UserSavedArticleResponseDto] })
  @ApiUserAuth({ validation: true, errors: [ARTICLES_ERRORS.USER_NOT_FOUND] })
  async saveArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: WikipediaArticleDto,
  ): Promise<UserSavedArticle[]> {
    return this.articlesService.saveArticleForUser(user.id, body);
  }

  @Delete('api/users/me/articles/saved/:articleId')
  @ApiOperation({ operationId: 'removeSavedArticle' })
  @ApiOkResponse({ type: [UserSavedArticleResponseDto] })
  @ApiUserAuth({ validation: true, errors: [ARTICLES_ERRORS.USER_NOT_FOUND] })
  async removeSavedArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { articleId }: SavedArticleIdParamsDto,
  ): Promise<UserSavedArticle[]> {
    return this.articlesService.removeSavedArticleForUser(user.id, articleId);
  }

  @Get('api/users/me/articles/recent')
  @ApiOperation({ operationId: 'getRecentArticles' })
  @ApiOkResponse({ type: [UserRecentArticleResponseDto] })
  @ApiUserAuth({ validation: false, errors: [ARTICLES_ERRORS.USER_NOT_FOUND] })
  async getRecentArticles(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserRecentArticle[]> {
    return this.articlesService.getRecentArticles(user.id);
  }

  @Post('api/users/me/articles/recent')
  @ApiOperation({ operationId: 'recordRecentArticle' })
  @ApiCreatedResponse({ type: [UserRecentArticleResponseDto] })
  @ApiUserAuth({ validation: true, errors: [ARTICLES_ERRORS.USER_NOT_FOUND] })
  async recordRecentArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: WikipediaArticleDto,
  ): Promise<UserRecentArticle[]> {
    return this.articlesService.recordRecentArticleForUser(user.id, body);
  }

  @Get('articles/:id')
  @ApiOperation({ operationId: 'getWikipediaArticleDetail', security: [] })
  @ApiOkResponse({ type: WikipediaArticleDetailResponseDto })
  @ApiErrorResponses({
    validation: true,
    errors: [
      ARTICLES_ERRORS.WIKIPEDIA_REQUEST_FAILED,
      ARTICLES_ERRORS.WIKIPEDIA_INVALID_RESPONSE,
      ARTICLES_ERRORS.WIKIPEDIA_HTML_REQUEST_FAILED,
      ARTICLES_ERRORS.WIKIPEDIA_ARTICLE_UNAVAILABLE,
      ARTICLES_ERRORS.WIKIPEDIA_CONTENT_UNAVAILABLE,
    ],
  })
  async getArticleDetail(
    @Param() { id }: ArticleIdParamsDto,
    @Query() query: ArticleDetailQueryDto,
  ): Promise<WikipediaArticleDetail> {
    return this.articlesService.getArticleDetail(id, query.languageCode);
  }

  @Post('api/articles/simplify')
  @ApiOperation({ operationId: 'simplifyArticle', security: [] })
  @ApiCreatedResponse({ type: SimplifyArticleResponseDto })
  @ApiErrorResponses({
    validation: true,
    errors: [
      ARTICLES_ERRORS.SIMPLIFICATION_FAILED,
      ARTICLES_ERRORS.ADAPTATION_UNAVAILABLE,
      ARTICLES_ERRORS.SUMMARY_UNAVAILABLE,
    ],
  })
  async simplifyArticle(
    @Body() body: SimplifyArticleDto,
  ): Promise<SimplifyArticleResponse> {
    return this.articlesService.simplifyArticle(body);
  }

  @Post('api/articles/quiz')
  @ApiOperation({ operationId: 'generateArticleQuiz' })
  @ApiCreatedResponse({ type: GenerateArticleQuizResponseDto })
  @ApiUserAuth({
    validation: true,
    errors: [ARTICLES_ERRORS.QUIZ_GENERATION_FAILED],
  })
  async generateArticleQuiz(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: GenerateArticleQuizDto,
  ): Promise<GenerateArticleQuizResponseDto> {
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
  @ApiOperation({ operationId: 'generateArticleVocabularyQuiz' })
  @ApiCreatedResponse({ type: GenerateArticleVocabularyQuizResponseDto })
  @ApiUserAuth({
    validation: true,
    errors: [ARTICLES_ERRORS.VOCABULARY_QUIZ_GENERATION_FAILED],
  })
  async generateArticleVocabularyQuiz(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: GenerateArticleVocabularyQuizDto,
  ): Promise<GenerateArticleVocabularyQuizResponseDto> {
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
