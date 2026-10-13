import { Injectable } from '@nestjs/common';

import { ArticleAdaptationService } from './transformation/article-adaptation.service';
import { ArticleLibraryService } from './library/article-library.service';
import { ArticleQuizService } from './quiz/article-quiz.service';
import { WikipediaArticlesService } from './discovery/wikipedia-articles.service';
import {
  type ArticleAdaptationsByArticleId,
  type ArticleBlock,
  type ArticleQuizQuestion,
  type ArticleSimplificationLevel,
  type ArticleSimplificationTargetLength,
  type ArticleTextTransformationType,
  type GenerateArticleVocabularyQuizResponse,
  type GetWikipediaArticlesParams,
  type SimplifyArticleResponse,
  type UserRecentArticle,
  type UserSavedArticle,
  type WikipediaArticle,
  type WikipediaArticleDetail,
} from './contracts/types';

const DEFAULT_ARTICLE_LIMIT = 20;

/**
 * Stable facade for the articles domain. Focused services own discovery,
 * the user library, AI transformations, and quiz generation.
 */
@Injectable()
export class ArticlesService {
  constructor(
    private readonly adaptationService: ArticleAdaptationService,
    private readonly articleLibrary: ArticleLibraryService,
    private readonly quizService: ArticleQuizService,
    private readonly wikipediaArticles: WikipediaArticlesService,
  ) {}

  async getArticles(
    articleParams: GetWikipediaArticlesParams = {},
  ): Promise<WikipediaArticle[]> {
    const limit = this.wikipediaArticles.normalizeLimit(
      articleParams.limit ?? DEFAULT_ARTICLE_LIMIT,
    );
    const search = articleParams.search?.trim();
    const articles = await this.wikipediaArticles.discover({
      category: articleParams.category ?? 'all',
      excludeIds: articleParams.excludeIds ?? [],
      limit,
      previewLength: articleParams.previewLength ?? 'all',
      recommended: articleParams.recommended !== false,
      search,
    });
    const articlesWithAdaptations =
      await this.articleLibrary.attachAvailableAdaptations(articles);

    return this.wikipediaArticles.applyPresentation(articlesWithAdaptations, {
      limit,
      preferImagesFirst: articleParams.preferImagesFirst ?? false,
      readyLevel: articleParams.readyLevel ?? 'all',
      readyTransformationType: articleParams.readyTransformationType ?? 'all',
      sortBy: articleParams.sortBy ?? 'default',
    });
  }

  getRandomArticles(
    limit = DEFAULT_ARTICLE_LIMIT,
  ): Promise<WikipediaArticle[]> {
    return this.getArticles({ limit, recommended: false });
  }

  getArticleDetail(
    pageId: number,
    languageCode = 'en',
  ): Promise<WikipediaArticleDetail> {
    return this.wikipediaArticles.getArticleDetail(pageId, languageCode);
  }

  getSavedArticles(userId: string): Promise<UserSavedArticle[]> {
    return this.articleLibrary.getSavedArticles(userId);
  }

  saveArticleForUser(
    userId: string,
    article: WikipediaArticle,
  ): Promise<UserSavedArticle[]> {
    return this.articleLibrary.saveArticle(userId, article);
  }

  removeSavedArticleForUser(
    userId: string,
    articleId: number,
  ): Promise<UserSavedArticle[]> {
    return this.articleLibrary.removeSavedArticle(userId, articleId);
  }

  getRecentArticles(userId: string): Promise<UserRecentArticle[]> {
    return this.articleLibrary.getRecentArticles(userId);
  }

  recordRecentArticleForUser(
    userId: string,
    article: WikipediaArticle,
  ): Promise<UserRecentArticle[]> {
    return this.articleLibrary.recordRecentArticle(userId, article);
  }

  getAvailableAdaptationsByArticleIds(
    articleIds: number[],
    transformationType?: ArticleTextTransformationType | 'all',
  ): Promise<ArticleAdaptationsByArticleId> {
    return this.articleLibrary.getAvailableAdaptations(
      articleIds,
      transformationType,
    );
  }

  simplifyArticle(params: {
    articleId?: number;
    blocks?: ArticleBlock[];
    level?: ArticleSimplificationLevel;
    text: string;
    title?: string;
    transformationType?: ArticleTextTransformationType;
  }): Promise<SimplifyArticleResponse> {
    return this.adaptationService.simplify(params);
  }

  generateArticleQuiz(params: {
    level?: ArticleSimplificationLevel;
    targetLength?: ArticleSimplificationTargetLength;
    text: string;
    title?: string;
  }): Promise<ArticleQuizQuestion[]> {
    return this.quizService.generateReadingQuiz(params);
  }

  generateArticleVocabularyQuiz(params: {
    level?: ArticleSimplificationLevel;
    text: string;
    title?: string;
  }): Promise<GenerateArticleVocabularyQuizResponse> {
    return this.quizService.generateVocabularyQuiz(params);
  }
}
