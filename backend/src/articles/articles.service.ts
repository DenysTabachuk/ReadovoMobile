import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import Groq from 'groq-sdk';

import { DatabaseService } from '../database/database.service';
import {
  extractPlainTextFromBlocks,
  parseHtmlToBlocks,
  sanitizeWikipediaText,
} from './article-html-parser';
import {
  type ArticleBlock,
  type ArticleQuizQuestion,
  type ArticleQuizQuestionOption,
  type ArticleQuizQuestionType,
  type ArticleAdaptationsByArticleId,
  type ArticleSimplificationTargetPercent,
  type ArticleSimplificationLevel,
  type ArticleSimplificationTargetLength,
  type ArticleVocabularyQuizQuestion,
  type ArticleVocabularyQuizQuestionFormat,
  type ArticleVocabularyQuizTermKind,
  type FormulaBlock,
  type GenerateArticleVocabularyQuizResponse,
  type GetWikipediaArticlesParams,
  type SimplifiedArticleCacheRow,
  type SimplifyArticleResponse,
  type TableCell,
  type UserRecentArticle,
  type UserSavedArticle,
  type WikipediaApiResponse,
  type WikipediaArticle,
  type WikipediaArticleCategory,
  type WikipediaArticleDetail,
  type WikipediaArticlePreviewLength,
  type WikipediaPage,
} from './types';

const DEFAULT_ARTICLE_LIMIT = 20;
const DEFAULT_SIMPLIFICATION_LEVEL: ArticleSimplificationLevel = 'A2';
const DEFAULT_TARGET_LENGTH: ArticleSimplificationTargetLength = 'short';
const DEFAULT_TARGET_PERCENT: ArticleSimplificationTargetPercent = 25;
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_REQUEST_TIMEOUT_MS = 45000;
const MAX_SIMPLIFICATION_CHUNK_CHARS = 50000;
const MAX_SIMPLIFICATION_CHUNK_COMPLETION_TOKENS = 1400;
const MAX_SIMPLIFICATION_COMPLETION_TOKENS = 2048;
const MAX_VOCABULARY_QUIZ_COMPLETION_TOKENS = 2400;
const MAX_ARTICLE_LIMIT = 50;
const MIN_BROWSE_EXTRACT_LENGTH = 90;
const MIN_BROWSE_PAGE_LENGTH = 5000;
const MIN_RECOMMENDED_EXTRACT_LENGTH = 80;
const MIN_RECOMMENDED_PAGE_LENGTH = 4500;
const MIN_SEARCH_EXTRACT_LENGTH = 60;
const MIN_SEARCH_PAGE_LENGTH = 1800;
const WIKIMEDIA_USER_AGENT = 'Readovo/1.0';
const WIKIPEDIA_LANGUAGE_CODE = 'en';
const WIKIPEDIA_CATEGORY_TITLES: Record<
  Exclude<WikipediaArticleCategory, 'all'>,
  string
> = {
  biography: 'Biography',
  culture: 'Culture',
  food: 'Food and drink',
  geography: 'Geography',
  history: 'History',
  nature: 'Nature',
  science: 'Science',
  space: 'Outer space',
  sports: 'Sports',
  technology: 'Technology',
};
const WIKIPEDIA_CATEGORY_SEARCH_TERMS: Record<
  Exclude<WikipediaArticleCategory, 'all'>,
  string
> = {
  biography: 'famous biography',
  culture: 'culture art',
  food: 'food cuisine',
  geography: 'geography places',
  history: 'history civilization',
  nature: 'nature environment',
  science: 'science discovery',
  space: 'space astronomy',
  sports: 'sport championship',
  technology: 'technology invention',
};
const WIKIPEDIA_EXCLUDED_TITLE_PATTERNS = [
  /^Category:/i,
  /^Glossary of/i,
  /^Index of/i,
  /^List of/i,
  /^Outline of/i,
  /^Timeline of/i,
  /\(disambiguation\)$/i,
];
const SIMPLIFICATION_TARGET_PERCENTS: ArticleSimplificationTargetPercent[] = [
  10, 25, 50, 75, 100,
];
const VOCABULARY_QUIZ_STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'been',
  'being',
  'but',
  'by',
  'for',
  'from',
  'had',
  'has',
  'have',
  'he',
  'her',
  'hers',
  'him',
  'his',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'me',
  'more',
  'most',
  'my',
  'of',
  'on',
  'or',
  'our',
  'she',
  'than',
  'that',
  'the',
  'their',
  'them',
  'there',
  'they',
  'this',
  'to',
  'was',
  'were',
  'what',
  'when',
  'which',
  'who',
  'will',
  'with',
  'you',
  'your',
]);
const RECOMMENDED_ARTICLE_TITLES: Record<
  Exclude<WikipediaArticleCategory, 'all'>,
  string[]
> = {
  biography: [
    'Albert Einstein',
    'Marie Curie',
    'Nikola Tesla',
    'Ada Lovelace',
    'Cleopatra',
    'Nelson Mandela',
    'Mahatma Gandhi',
    'Frida Kahlo',
    'Charles Darwin',
    'Amelia Earhart',
    'Leonardo da Vinci',
    'William Shakespeare',
    'Isaac Newton',
    'Martin Luther King Jr.',
    'Florence Nightingale',
    'Alan Turing',
    'Jane Austen',
    'Galileo Galilei',
    'Alexander the Great',
    'Queen Victoria',
  ],
  culture: [
    'Renaissance',
    'Impressionism',
    'Jazz',
    'Cinema',
    'Architecture',
    'Greek mythology',
    'Photography',
    'Ballet',
    'Opera',
    'Hip hop music',
    'Modern art',
    'Theatre',
    'Calligraphy',
    'Fashion',
    'Manga',
    'Museum',
    'Street art',
    'Classical music',
    'Animation',
    'World Heritage Site',
  ],
  food: [
    'Coffee',
    'Chocolate',
    'Pizza',
    'Sushi',
    'Tea',
    'Bread',
    'Wine',
    'Cheese',
    'Curry',
    'Ice cream',
    'Pasta',
    'Honey',
    'Rice',
    'Olive oil',
    'Fermentation',
    'Cuisine',
    'Hamburger',
    'Apple',
    'Spice',
    'Baking',
  ],
  geography: [
    'Grand Canyon',
    'Sahara',
    'Nile',
    'Himalayas',
    'New York City',
    'London',
    'Japan',
    'Ukraine',
    'Mediterranean Sea',
    'Great Wall of China',
    'Amazon River',
    'Alps',
    'Iceland',
    'Venice',
    'Pacific Ocean',
    'Istanbul',
    'Machu Picchu',
    'Yellowstone National Park',
    'Arctic',
    'Singapore',
  ],
  history: [
    'Ancient Egypt',
    'Roman Empire',
    'Vikings',
    'Silk Road',
    'World War II',
    'Cold War',
    'Industrial Revolution',
    'French Revolution',
    'Byzantine Empire',
    'Mongol Empire',
    'History of writing',
    'Age of Discovery',
    'American Revolution',
    'Ottoman Empire',
    'Maya civilization',
    'Great Fire of London',
    'Berlin Wall',
    'Space Race',
    'Renaissance',
    'Printing press',
  ],
  nature: [
    'Amazon rainforest',
    'Great Barrier Reef',
    'Mount Everest',
    'Ocean',
    'Volcano',
    'Antarctica',
    'Rainforest',
    'Coral reef',
    'Yellowstone National Park',
    'Water cycle',
    'Earthquake',
    'Desert',
    'Glacier',
    'Climate change',
    'Biodiversity',
    'Tsunami',
    'Aurora',
    'Monsoon',
    'Wetland',
    'Everglades',
  ],
  science: [
    'Evolution',
    'Periodic table',
    'Photosynthesis',
    'DNA',
    'Quantum mechanics',
    'Plate tectonics',
    'Vaccine',
    'Human brain',
    'Electricity',
    'Gravity',
    'Atom',
    'Dinosaur',
    'Penicillin',
    'Relativity',
    'Ecosystem',
    'Microscope',
    'Gene',
    'Radioactivity',
    'Fossil',
    'Scientific method',
  ],
  space: [
    'Moon',
    'Mars',
    'Jupiter',
    'Milky Way',
    'International Space Station',
    'Hubble Space Telescope',
    'Space exploration',
    'Apollo 11',
    'James Webb Space Telescope',
    'Exoplanet',
    'Solar System',
    'Sun',
    'Saturn',
    'Black hole',
    'Comet',
    'Asteroid belt',
    'Space Shuttle',
    'Voyager program',
    'Nebula',
    'Big Bang',
  ],
  sports: [
    'Association football',
    'Basketball',
    'Olympic Games',
    'Tennis',
    'Formula One',
    'Cricket',
    'Baseball',
    'Rugby union',
    'Swimming (sport)',
    'Athletics (sport)',
    'Boxing',
    'Ice hockey',
    'Volleyball',
    'Cycling',
    'Skiing',
    'Surfing',
    'Chess',
    'Marathon',
    'FIFA World Cup',
    'Tour de France',
  ],
  technology: [
    'Internet',
    'Artificial intelligence',
    'Smartphone',
    'Electric car',
    'Robotics',
    'Computer',
    'Renewable energy',
    'Printing press',
    'Steam engine',
    'Blockchain',
    'Video game',
    'Virtual reality',
    'Satellite',
    '3D printing',
    'Semiconductor',
    'Battery',
    'Electricity generation',
    'Telephone',
    'World Wide Web',
    'Machine learning',
  ],
};
const nodeRequire = createRequire(__filename);

type MathJaxModule = {
  init: (config: Record<string, unknown>) => Promise<MathJaxModule>;
  mathml2svgPromise: (
    mathml: string,
    options: { display: boolean },
  ) => Promise<unknown>;
  startup: {
    adaptor: {
      firstChild: (node: unknown) => unknown;
      getAttribute: (node: unknown, name: string) => string | undefined;
      serializeXML: (node: unknown) => string;
    };
  };
  tex2svgPromise: (
    latex: string,
    options: { display: boolean },
  ) => Promise<unknown>;
};

type ArticlePreviewQualityOptions = {
  minExtractLength: number;
  minPageLength: number;
  requireThumbnail: boolean;
};

type SimplificationChunk = {
  blocks?: ArticleBlock[];
  index: number;
  text: string;
  total: number;
};

type SimplificationModelResponse = {
  adaptedBlocks: ArticleBlock[];
  questions?: ArticleQuizQuestion[];
};

type UserArticleRow = {
  article_id: number;
  extract: string;
  opened_at?: Date | string;
  saved_at?: Date | string;
  thumbnail_url?: string;
  title: string;
  url: string;
};

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);
  private readonly formulaRenderCache = new Map<string, FormulaBlock>();
  private mathJaxPromise: Promise<MathJaxModule> | null = null;

  constructor(private readonly databaseService: DatabaseService) {}

  async getArticles(
    articleParams: GetWikipediaArticlesParams = {},
  ): Promise<WikipediaArticle[]> {
    const normalizedLimit = this.normalizeLimit(
      articleParams.limit ?? DEFAULT_ARTICLE_LIMIT,
    );
    const category = articleParams.category ?? 'all';
    const excludeIds = articleParams.excludeIds ?? [];
    const previewLength = articleParams.previewLength ?? 'all';
    const search = articleParams.search?.trim();
    const shouldUseRecommendedArticles =
      articleParams.recommended !== false && !search;

    if (shouldUseRecommendedArticles) {
      const articles = await this.getRecommendedArticles({
        category,
        excludeIds,
        limit: normalizedLimit,
        previewLength,
      });

      return this.attachAvailableAdaptations(articles);
    }

    const articles = await this.getLiveArticles({
      category,
      excludeIds,
      limit: normalizedLimit,
      previewLength,
      search,
    });

    return this.attachAvailableAdaptations(articles);
  }

  async getRandomArticles(
    limit = DEFAULT_ARTICLE_LIMIT,
  ): Promise<WikipediaArticle[]> {
    return this.getArticles({ limit, recommended: false });
  }

  private async getLiveArticles(params: {
    category: WikipediaArticleCategory;
    excludeIds?: number[];
    limit: number;
    previewLength: WikipediaArticlePreviewLength;
    search?: string;
  }): Promise<WikipediaArticle[]> {
    const search = params.search;
    const requestLimit = search
      ? Math.min(MAX_ARTICLE_LIMIT, params.limit * 3)
      : Math.min(MAX_ARTICLE_LIMIT, params.limit * 4);
    const queryParams = new URLSearchParams({
      action: 'query',
      exintro: '1',
      explaintext: '1',
      exsentences: '2',
      format: 'json',
      inprop: 'url',
      origin: '*',
      piprop: 'thumbnail',
      pithumbsize: '200',
      prop: 'extracts|pageimages|info',
      redirects: '1',
    });

    if (search) {
      queryParams.set('generator', 'search');
      queryParams.set(
        'gsrsearch',
        this.buildSearchQuery(search, params.category),
      );
      queryParams.set('gsrlimit', String(requestLimit));
      queryParams.set('gsrnamespace', '0');
    } else if (params.category !== 'all') {
      queryParams.set('generator', 'search');
      queryParams.set(
        'gsrsearch',
        this.buildSearchQuery(
          WIKIPEDIA_CATEGORY_SEARCH_TERMS[params.category],
          params.category,
        ),
      );
      queryParams.set('gsrlimit', String(requestLimit));
      queryParams.set('gsrnamespace', '0');
    } else {
      queryParams.set('generator', 'random');
      queryParams.set('grnlimit', String(requestLimit));
      queryParams.set('grnnamespace', '0');
    }

    const data = await this.fetchWikipediaResponse(queryParams);
    const qualityOptions = search
      ? {
          minExtractLength: MIN_SEARCH_EXTRACT_LENGTH,
          minPageLength: MIN_SEARCH_PAGE_LENGTH,
          requireThumbnail: false,
        }
      : {
          minExtractLength: MIN_BROWSE_EXTRACT_LENGTH,
          minPageLength: MIN_BROWSE_PAGE_LENGTH,
          requireThumbnail: true,
        };
    const excludedIds = new Set(params.excludeIds ?? []);

    return this.getPagesFromResponse(data)
      .filter((page) => !excludedIds.has(page.pageid))
      .filter((page) =>
        this.isUsableArticlePreview(page, qualityOptions, params.previewLength),
      )
      .map((page) => this.mapPageToArticle(page))
      .slice(0, params.limit);
  }

  private async getRecommendedArticles(params: {
    category: WikipediaArticleCategory;
    excludeIds: number[];
    limit: number;
    previewLength: WikipediaArticlePreviewLength;
  }): Promise<WikipediaArticle[]> {
    const titles = this.getRecommendedArticleTitles(
      params.category,
      params.limit,
    );
    const queryParams = new URLSearchParams({
      action: 'query',
      exintro: '1',
      explaintext: '1',
      exsentences: '2',
      format: 'json',
      inprop: 'url',
      origin: '*',
      piprop: 'thumbnail',
      pithumbsize: '200',
      prop: 'extracts|pageimages|info',
      redirects: '1',
      titles: titles.join('|'),
    });
    const data = await this.fetchWikipediaResponse(queryParams);
    const titleRank = new Map(
      titles.map((title, index) => [this.normalizeTitle(title), index]),
    );
    const excludedIds = new Set(params.excludeIds);

    const recommendedArticles = this.getPagesFromResponse(data)
      .filter((page) => !excludedIds.has(page.pageid))
      .filter((page) =>
        this.isUsableArticlePreview(
          page,
          {
            minExtractLength: MIN_RECOMMENDED_EXTRACT_LENGTH,
            minPageLength: MIN_RECOMMENDED_PAGE_LENGTH,
            requireThumbnail: true,
          },
          params.previewLength,
        ),
      )
      .sort(
        (left, right) =>
          (titleRank.get(this.normalizeTitle(left.title)) ??
            Number.MAX_SAFE_INTEGER) -
          (titleRank.get(this.normalizeTitle(right.title)) ??
            Number.MAX_SAFE_INTEGER),
      )
      .map((page) => this.mapPageToArticle(page));

    if (recommendedArticles.length >= params.limit) {
      return recommendedArticles.slice(0, params.limit);
    }

    const fallbackArticles = await this.getLiveArticles({
      category: params.category,
      excludeIds: [
        ...params.excludeIds,
        ...recommendedArticles.map((article) => article.id),
      ],
      limit: params.limit - recommendedArticles.length,
      previewLength: params.previewLength,
    });

    return [...recommendedArticles, ...fallbackArticles].slice(0, params.limit);
  }

  async getArticleDetail(pageId: number): Promise<WikipediaArticleDetail> {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      inprop: 'url',
      origin: '*',
      pageids: String(pageId),
      piprop: 'thumbnail',
      pithumbsize: '480',
      prop: 'pageimages|info',
      redirects: '1',
    });
    const data = await this.fetchWikipediaResponse(params);
    const page = this.getPagesFromResponse(data).find(
      (currentPage) => currentPage.pageid === pageId,
    );

    if (!page?.title || !page.fullurl) {
      throw new BadGatewayException('Wikipedia article is unavailable.');
    }

    const html = await this.fetchWikipediaHtml(page.title);
    const blocks = await this.renderFormulaBlocks(parseHtmlToBlocks(html));
    const content = extractPlainTextFromBlocks(blocks);

    if (!content) {
      throw new BadGatewayException(
        'Wikipedia article content is unavailable.',
      );
    }

    return {
      blocks,
      content,
      id: page.pageid,
      title: page.title,
      url: page.fullurl,
      thumbnailUrl: page.thumbnail?.source,
    };
  }

  private async attachAvailableAdaptations<T extends WikipediaArticle>(
    articles: T[],
  ): Promise<T[]> {
    if (articles.length === 0) {
      return articles;
    }

    const articleIds = articles.map((article) => article.id);
    const result = await this.databaseService.query<{
      article_id: number;
      level: string;
      target_percent: number;
    }>(
      `
        SELECT DISTINCT article_id, level, target_percent
        FROM article_simplifications
        WHERE article_id = ANY($1::int[])
          AND target_percent IS NOT NULL
          AND adapted_blocks IS NOT NULL
        ORDER BY level, target_percent
      `,
      [articleIds],
    );
    const adaptationsByArticleId = new Map<
      number,
      WikipediaArticle['availableAdaptations']
    >();

    for (const row of result.rows) {
      const targetPercent = this.normalizeTargetPercent(row.target_percent);

      if (!targetPercent || !this.isSimplificationLevel(row.level)) {
        continue;
      }

      const currentAdaptations =
        adaptationsByArticleId.get(row.article_id) ?? [];

      currentAdaptations.push({
        level: row.level,
        targetPercent,
      });
      adaptationsByArticleId.set(row.article_id, currentAdaptations);
    }

    return articles.map((article) => {
      const availableAdaptations = adaptationsByArticleId.get(article.id);

      return availableAdaptations?.length
        ? ({ ...article, availableAdaptations } as T)
        : article;
    });
  }

  async getSavedArticles(userId: string): Promise<UserSavedArticle[]> {
    await this.ensureUserExists(userId);

    const result = await this.databaseService.query<UserArticleRow>(
      `
        SELECT article_id,
               title,
               extract,
               url,
               thumbnail_url,
               saved_at
        FROM user_saved_articles
        WHERE user_id = $1
        ORDER BY saved_at DESC
      `,
      [userId],
    );
    const articles = result.rows.map((row) => this.mapSavedArticleRow(row));

    return this.attachAvailableAdaptations(articles);
  }

  async saveArticleForUser(
    userId: string,
    article: WikipediaArticle,
  ): Promise<UserSavedArticle[]> {
    await this.ensureUserExists(userId);

    await this.databaseService.query(
      `
        INSERT INTO user_saved_articles (
          user_id,
          article_id,
          title,
          extract,
          url,
          thumbnail_url,
          saved_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, now())
        ON CONFLICT (user_id, article_id) DO UPDATE
        SET title = EXCLUDED.title,
            extract = EXCLUDED.extract,
            url = EXCLUDED.url,
            thumbnail_url = EXCLUDED.thumbnail_url,
            saved_at = EXCLUDED.saved_at
      `,
      [
        userId,
        article.id,
        article.title,
        article.extract,
        article.url,
        article.thumbnailUrl ?? null,
      ],
    );

    return this.getSavedArticles(userId);
  }

  async removeSavedArticleForUser(
    userId: string,
    articleId: number,
  ): Promise<UserSavedArticle[]> {
    await this.ensureUserExists(userId);

    await this.databaseService.query(
      `
        DELETE FROM user_saved_articles
        WHERE user_id = $1
          AND article_id = $2
      `,
      [userId, articleId],
    );

    return this.getSavedArticles(userId);
  }

  async getRecentArticles(userId: string): Promise<UserRecentArticle[]> {
    await this.ensureUserExists(userId);

    const result = await this.databaseService.query<UserArticleRow>(
      `
        SELECT article_id,
               title,
               extract,
               url,
               thumbnail_url,
               opened_at
        FROM user_recent_articles
        WHERE user_id = $1
        ORDER BY opened_at DESC
        LIMIT 50
      `,
      [userId],
    );
    const articles = result.rows.map((row) => this.mapRecentArticleRow(row));

    return this.attachAvailableAdaptations(articles);
  }

  async recordRecentArticleForUser(
    userId: string,
    article: WikipediaArticle,
  ): Promise<UserRecentArticle[]> {
    await this.ensureUserExists(userId);

    await this.databaseService.query(
      `
        INSERT INTO user_recent_articles (
          user_id,
          article_id,
          title,
          extract,
          url,
          thumbnail_url,
          opened_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, now())
        ON CONFLICT (user_id, article_id) DO UPDATE
        SET title = EXCLUDED.title,
            extract = EXCLUDED.extract,
            url = EXCLUDED.url,
            thumbnail_url = EXCLUDED.thumbnail_url,
            opened_at = EXCLUDED.opened_at
      `,
      [
        userId,
        article.id,
        article.title,
        article.extract,
        article.url,
        article.thumbnailUrl ?? null,
      ],
    );

    await this.databaseService.query(
      `
        DELETE FROM user_recent_articles
        WHERE user_id = $1
          AND article_id NOT IN (
            SELECT article_id
            FROM user_recent_articles
            WHERE user_id = $1
            ORDER BY opened_at DESC
            LIMIT 50
          )
      `,
      [userId],
    );

    return this.getRecentArticles(userId);
  }

  async getAvailableAdaptationsByArticleIds(
    articleIds: number[],
  ): Promise<ArticleAdaptationsByArticleId> {
    if (articleIds.length === 0) {
      return {};
    }

    const result = await this.databaseService.query<{
      article_id: number;
      level: string;
      target_percent: number;
    }>(
      `
        SELECT DISTINCT article_id, level, target_percent
        FROM article_simplifications
        WHERE article_id = ANY($1::int[])
          AND target_percent IS NOT NULL
          AND adapted_blocks IS NOT NULL
        ORDER BY article_id, level, target_percent
      `,
      [Array.from(new Set(articleIds))],
    );
    const adaptationsByArticleId: ArticleAdaptationsByArticleId = {};

    for (const row of result.rows) {
      const targetPercent = this.normalizeTargetPercent(row.target_percent);

      if (!targetPercent || !this.isSimplificationLevel(row.level)) {
        continue;
      }

      const articleId = String(row.article_id);

      adaptationsByArticleId[articleId] = [
        ...(adaptationsByArticleId[articleId] ?? []),
        {
          level: row.level,
          targetPercent,
        },
      ];
    }

    return adaptationsByArticleId;
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const result = await this.databaseService.query(
      `
        SELECT id
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId],
    );

    if (!result.rows[0]) {
      throw new NotFoundException('User not found.');
    }
  }

  private mapSavedArticleRow(row: UserArticleRow): UserSavedArticle {
    return {
      extract: row.extract,
      id: row.article_id,
      savedAt: this.serializeTimestamp(row.saved_at),
      thumbnailUrl: row.thumbnail_url ?? undefined,
      title: row.title,
      url: row.url,
    };
  }

  private mapRecentArticleRow(row: UserArticleRow): UserRecentArticle {
    return {
      extract: row.extract,
      id: row.article_id,
      openedAt: this.serializeTimestamp(row.opened_at),
      thumbnailUrl: row.thumbnail_url ?? undefined,
      title: row.title,
      url: row.url,
    };
  }

  private serializeTimestamp(value: Date | string | undefined): string {
    if (value instanceof Date) {
      return value.toISOString();
    }

    return value ?? new Date().toISOString();
  }

  async simplifyArticle(params: {
    articleId?: number;
    blocks?: ArticleBlock[];
    level?: ArticleSimplificationLevel;
    targetPercent?: ArticleSimplificationTargetPercent;
    text: string;
    title?: string;
  }): Promise<SimplifyArticleResponse> {
    const title = params.title?.trim() || 'Untitled article';
    const text = params.text.trim();
    const level = params.level ?? DEFAULT_SIMPLIFICATION_LEVEL;
    const targetPercent = params.targetPercent ?? DEFAULT_TARGET_PERCENT;
    const originalLength = text.length;
    const sourceBlocks =
      params.blocks && params.blocks.length > 0 ? params.blocks : undefined;
    const sourceHash = this.createSourceHash({ sourceBlocks, text, title });
    const cacheKey = this.createSimplificationCacheKey({
      articleId: params.articleId,
      level,
      sourceHash,
      targetPercent,
      title,
    });
    const cachedResponse = await this.getCachedSimplification(cacheKey);

    if (cachedResponse) {
      this.logger.log(
        `Simplification cache hit: title="${title}", level=${level}, targetPercent=${targetPercent}`,
      );
      return cachedResponse;
    }

    this.logger.log(
      `Simplification cache miss: title="${title}", level=${level}, targetPercent=${targetPercent}, originalLength=${originalLength}`,
    );

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      this.logger.error(
        `Groq key is missing for article simplification: title="${title}"`,
      );
      throw new InternalServerErrorException(
        'Article simplification service is not configured.',
      );
    }

    try {
      this.logger.log(
        `Sending simplification request to Groq: model=${GROQ_MODEL}, title="${title}"`,
      );

      // Groq runs only on the backend so the API key never reaches the app.
      const client = new Groq({ apiKey });
      const targetPercentsToPrepare = await this.getMissingTargetPercents({
        articleId: params.articleId,
        level,
        requestedTargetPercent: targetPercent,
        sourceHash,
        title,
      });
      const preparedResponses = new Map<
        ArticleSimplificationTargetPercent,
        SimplifyArticleResponse
      >();

      for (const currentTargetPercent of targetPercentsToPrepare) {
        const parsedResponse =
          text.length > MAX_SIMPLIFICATION_CHUNK_CHARS
            ? await this.simplifyArticleInChunks({
                client,
                level,
                sourceBlocks,
                targetPercent: currentTargetPercent,
                text,
                title,
              })
            : await this.simplifySingleArticleInput({
                client,
                level,
                sourceBlocks,
                targetPercent: currentTargetPercent,
                text,
                title,
              });
        const adaptedBlocks = parsedResponse.adaptedBlocks;

        if (adaptedBlocks.length === 0) {
          this.logger.error(
            `Groq returned empty simplification blocks: title="${title}", targetPercent=${currentTargetPercent}`,
          );
          throw new BadGatewayException(
            'Article simplification is unavailable.',
          );
        }

        const adaptedLength =
          this.extractPlainTextFromArticleBlocks(adaptedBlocks).length;
        const response: SimplifyArticleResponse = {
          adaptedBlocks,
          adaptedLength,
          level,
          originalLength,
          targetPercent: currentTargetPercent,
          title,
          ...(parsedResponse.questions && parsedResponse.questions.length > 0
            ? { questions: parsedResponse.questions }
            : {}),
        };
        const currentCacheKey = this.createSimplificationCacheKey({
          articleId: params.articleId,
          level,
          sourceHash,
          targetPercent: currentTargetPercent,
          title,
        });

        await this.storeSimplification({
          articleId: params.articleId,
          cacheKey: currentCacheKey,
          response,
          sourceHash,
        });
        preparedResponses.set(currentTargetPercent, response);
        this.logger.log(
          `Simplification stored: title="${title}", targetPercent=${currentTargetPercent}, adaptedLength=${response.adaptedLength}`,
        );
      }

      const response =
        preparedResponses.get(targetPercent) ??
        (await this.getCachedSimplification(cacheKey));

      if (!response) {
        throw new BadGatewayException('Article simplification is unavailable.');
      }

      return response;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        this.logger.error(
          `Simplification failed with gateway error: title="${title}", reason="${error.message}"`,
        );
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown Groq error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Groq request failed: title="${title}", model=${GROQ_MODEL}, reason="${errorMessage}"`,
        errorStack,
      );

      throw new BadGatewayException('Failed to simplify article.');
    }
  }

  async generateArticleQuiz(params: {
    level?: ArticleSimplificationLevel;
    targetLength?: ArticleSimplificationTargetLength;
    text: string;
    title?: string;
  }): Promise<ArticleQuizQuestion[]> {
    const title = params.title?.trim() || 'Untitled article';
    const text = params.text.trim();
    const level = params.level ?? DEFAULT_SIMPLIFICATION_LEVEL;
    const targetLength = params.targetLength ?? DEFAULT_TARGET_LENGTH;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      this.logger.error(
        `Groq key is missing for article quiz: title="${title}"`,
      );
      throw new InternalServerErrorException(
        'Article quiz generation service is not configured.',
      );
    }

    const prompt = this.createQuizPrompt({
      level,
      targetLength,
      text,
      title,
    });

    try {
      const client = new Groq({ apiKey });
      const rawResponse = await this.createGroqTextCompletion({
        client,
        maxCompletionTokens: 1400,
        prompt,
        systemMessage:
          'You are helping to create educational English quizzes for language learners.',
      });
      const parsedResponse = this.parseQuizModelResponse(rawResponse);

      if (parsedResponse.length === 0) {
        throw new BadGatewayException(
          'Article quiz generation is unavailable.',
        );
      }

      return parsedResponse;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown Groq error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Groq quiz request failed: title="${title}", model=${GROQ_MODEL}, reason="${errorMessage}"`,
        errorStack,
      );

      throw new BadGatewayException('Failed to generate article quiz.');
    }
  }

  async generateArticleVocabularyQuiz(params: {
    level?: ArticleSimplificationLevel;
    text: string;
    title?: string;
  }): Promise<GenerateArticleVocabularyQuizResponse> {
    const title = params.title?.trim() || 'Untitled article';
    const text = params.text.trim();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      this.logger.error(
        `Groq key is missing for article vocabulary quiz: title="${title}"`,
      );
      throw new InternalServerErrorException(
        'Article vocabulary quiz generation service is not configured.',
      );
    }

    const targetQuestionCount = this.getVocabularyQuestionTarget(text);
    const prompt = this.createVocabularyQuizPrompt({
      level: params.level,
      targetQuestionCount,
      text,
      title,
    });

    try {
      const client = new Groq({ apiKey });
      const rawResponse = await this.createGroqTextCompletion({
        client,
        maxCompletionTokens: MAX_VOCABULARY_QUIZ_COMPLETION_TOKENS,
        prompt,
        systemMessage:
          'You create vocabulary quizzes from article texts for English learners.',
      });
      const parsedResponse = this.parseVocabularyQuizModelResponse({
        rawResponse,
        requestedLevel: params.level,
        sourceText: text,
        targetQuestionCount,
      });

      if (parsedResponse.questions.length === 0) {
        this.logger.warn(
          [
            `Vocabulary quiz generation returned no valid questions: title="${title}", requestedLevel="${params.level ?? 'auto'}", resolvedLevel="${parsedResponse.resolvedLevel}"`,
            `Diagnostics: ${parsedResponse.diagnostics.join(' | ') || 'none'}`,
            `Raw AI response: ${this.truncateForLog(rawResponse)}`,
          ].join('\n'),
        );
        throw new BadGatewayException(
          'Article vocabulary quiz generation is unavailable.',
        );
      }

      return {
        questions: parsedResponse.questions,
        resolvedLevel: parsedResponse.resolvedLevel,
      };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown Groq error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Groq vocabulary quiz request failed: title="${title}", model=${GROQ_MODEL}, reason="${errorMessage}"`,
        errorStack,
      );

      throw new BadGatewayException('Failed to generate article vocabulary quiz.');
    }
  }

  private async simplifySingleArticleInput(params: {
    client: Groq;
    level: ArticleSimplificationLevel;
    sourceBlocks?: ArticleBlock[];
    targetPercent: ArticleSimplificationTargetPercent;
    text: string;
    title: string;
  }): Promise<SimplificationModelResponse> {
    const prompt = this.createSimplificationPrompt({
      level: params.level,
      sourceBlocks: params.sourceBlocks,
      targetPercent: params.targetPercent,
      text: params.text,
      title: params.title,
    });
    const rawResponse = await this.createGroqTextCompletion({
      client: params.client,
      maxCompletionTokens: MAX_SIMPLIFICATION_COMPLETION_TOKENS,
      prompt,
      systemMessage:
        'You are helping to create educational English texts for language learners.',
    });

    return this.parseSimplificationModelResponse(rawResponse);
  }

  private async simplifyArticleInChunks(params: {
    client: Groq;
    level: ArticleSimplificationLevel;
    sourceBlocks?: ArticleBlock[];
    targetPercent: ArticleSimplificationTargetPercent;
    text: string;
    title: string;
  }): Promise<SimplificationModelResponse> {
    const chunks = this.createSimplificationChunks({
      sourceBlocks: params.sourceBlocks,
      text: params.text,
    });
    const adaptedChunkResponses: SimplificationModelResponse[] = [];

    this.logger.log(
      `Chunked simplification started: title="${params.title}", chunks=${chunks.length}`,
    );

    for (const chunk of chunks) {
      const prompt = this.createChunkSimplificationPrompt({
        chunk,
        level: params.level,
        targetPercent: params.targetPercent,
        title: params.title,
      });
      const rawResponse = await this.createGroqTextCompletion({
        client: params.client,
        maxCompletionTokens: MAX_SIMPLIFICATION_CHUNK_COMPLETION_TOKENS,
        prompt,
        systemMessage:
          'You simplify one article section at a time for English learners.',
      });
      const parsedResponse = this.parseSimplificationModelResponse(rawResponse);

      if (parsedResponse.adaptedBlocks.length > 0) {
        adaptedChunkResponses.push(parsedResponse);
      }
    }

    const adaptedBlocks = adaptedChunkResponses.flatMap(
      (response) => response.adaptedBlocks,
    );
    const adaptedText = this.extractPlainTextFromArticleBlocks(adaptedBlocks);

    if (adaptedBlocks.length === 0 || !adaptedText) {
      return { adaptedBlocks: [] };
    }

    const quizPrompt = this.createQuizPrompt({
      level: params.level,
      targetPercent: params.targetPercent,
      text: adaptedText,
      title: params.title,
    });
    const quizRawResponse = await this.createGroqTextCompletion({
      client: params.client,
      maxCompletionTokens: 1400,
      prompt: quizPrompt,
      systemMessage:
        'You are helping to create educational English quizzes for language learners.',
    });
    const questions = this.parseQuizModelResponse(quizRawResponse);

    return {
      adaptedBlocks,
      questions: questions.length > 0 ? questions : undefined,
    };
  }

  private async createGroqTextCompletion(params: {
    client: Groq;
    maxCompletionTokens: number;
    prompt: string;
    systemMessage: string;
  }): Promise<string> {
    const completion = await this.withTimeout(
      params.client.chat.completions.create({
        max_completion_tokens: params.maxCompletionTokens,
        messages: [
          {
            content: params.systemMessage,
            role: 'system',
          },
          {
            content: params.prompt,
            role: 'user',
          },
        ],
        model: GROQ_MODEL,
        temperature: 0.3,
      }),
      GROQ_REQUEST_TIMEOUT_MS,
      'Groq request timed out.',
    );

    return completion.choices[0]?.message?.content?.trim() ?? '';
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    message: string,
  ): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private async renderFormulaBlocks(
    blocks: ArticleBlock[],
  ): Promise<ArticleBlock[]> {
    return Promise.all(
      blocks.map(async (block) => {
        if (block.type !== 'formula') {
          return block;
        }

        return this.renderFormulaBlock(block);
      }),
    );
  }

  private async renderFormulaBlock(block: FormulaBlock): Promise<FormulaBlock> {
    if (block.svg || (!block.latex && !block.mathml)) {
      return block;
    }

    const cacheKey = this.createFormulaRenderCacheKey(block);
    const cachedBlock = this.formulaRenderCache.get(cacheKey);

    if (cachedBlock) {
      return cachedBlock;
    }

    try {
      const mathJax = await this.getMathJax();
      const renderedNode = block.mathml
        ? await mathJax.mathml2svgPromise(block.mathml, {
            display: block.display,
          })
        : await mathJax.tex2svgPromise(block.latex ?? '', {
            display: block.display,
          });
      const adaptor = mathJax.startup.adaptor;
      const svgNode = adaptor.firstChild(renderedNode);

      if (!svgNode) {
        return block;
      }

      const svg = adaptor.serializeXML(svgNode);
      const widthEx = this.parseMathJaxExLength(
        adaptor.getAttribute(svgNode, 'width'),
      );
      const heightEx = this.parseMathJaxExLength(
        adaptor.getAttribute(svgNode, 'height'),
      );
      const renderedBlock: FormulaBlock = {
        ...block,
        heightEx: heightEx ?? block.heightEx,
        svg,
        widthEx: widthEx ?? block.widthEx,
      };

      this.formulaRenderCache.set(cacheKey, renderedBlock);

      return renderedBlock;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Unknown formula render error: ${String(error)}`;

      this.logger.warn(
        `Failed to render math formula to SVG: reason="${errorMessage}"`,
      );

      return block;
    }
  }

  private createFormulaRenderCacheKey(block: FormulaBlock): string {
    return createHash('sha256')
      .update(
        `${block.display ? 'display' : 'inline'}::${block.latex ?? ''}::${block.mathml ?? ''}`,
      )
      .digest('hex');
  }

  private parseMathJaxExLength(value?: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const match = value.match(/^([0-9]+(?:\.[0-9]+)?)ex$/i);

    if (!match) {
      return undefined;
    }

    const parsedValue = Number.parseFloat(match[1] ?? '');

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return undefined;
    }

    return parsedValue;
  }

  private async getMathJax(): Promise<MathJaxModule> {
    if (!this.mathJaxPromise) {
      this.mathJaxPromise = this.initializeMathJax();
    }

    return this.mathJaxPromise;
  }

  private async initializeMathJax(): Promise<MathJaxModule> {
    (
      globalThis as {
        MathJax?: {
          config: Record<string, unknown>;
        };
      }
    ).MathJax = { config: {} };

    const mathJax = nodeRequire('mathjax/node-main.cjs') as MathJaxModule;

    await mathJax.init({
      loader: {
        load: ['input/tex', 'input/mathml', 'output/svg'],
      },
      svg: {
        fontCache: 'none',
      },
    });

    return mathJax;
  }

  private normalizeLimit(limit: number): number {
    if (!Number.isFinite(limit) || limit <= 0) {
      return DEFAULT_ARTICLE_LIMIT;
    }

    return Math.min(Math.floor(limit), MAX_ARTICLE_LIMIT);
  }

  private buildSearchQuery(
    search: string,
    category: WikipediaArticleCategory,
  ): string {
    if (category === 'all') {
      return search;
    }

    return `${search} incategory:"${WIKIPEDIA_CATEGORY_TITLES[category]}"`;
  }

  private getRecommendedArticleTitles(
    category: WikipediaArticleCategory,
    limit: number,
  ): string[] {
    const pool =
      category === 'all'
        ? Object.values(RECOMMENDED_ARTICLE_TITLES).flat()
        : RECOMMENDED_ARTICLE_TITLES[category];
    const uniqueTitles = Array.from(new Set(pool));
    const titleCount = Math.min(
      uniqueTitles.length,
      Math.max(limit, Math.min(MAX_ARTICLE_LIMIT, limit * 3)),
    );

    return this.shuffle(uniqueTitles).slice(0, titleCount);
  }

  private isUsableArticlePreview(
    page: WikipediaPage,
    options: ArticlePreviewQualityOptions,
    previewLength: WikipediaArticlePreviewLength,
  ): boolean {
    const title = sanitizeWikipediaText(page.title).trim();
    const extract = sanitizeWikipediaText(page.extract ?? '').trim();

    if (!page.fullurl || !title || !extract) {
      return false;
    }

    if (
      WIKIPEDIA_EXCLUDED_TITLE_PATTERNS.some((pattern) => pattern.test(title))
    ) {
      return false;
    }

    if (options.requireThumbnail && !page.thumbnail?.source) {
      return false;
    }

    if (extract.length < options.minExtractLength) {
      return false;
    }

    if ((page.length ?? 0) < options.minPageLength) {
      return false;
    }

    return this.isMatchingPreviewLength(extract, previewLength);
  }

  private isMatchingPreviewLength(
    extract: string,
    previewLength: WikipediaArticlePreviewLength,
  ): boolean {
    const extractLength = extract.trim().length;

    if (previewLength === 'all') {
      return true;
    }

    if (previewLength === 'short') {
      return extractLength > 0 && extractLength <= 120;
    }

    if (previewLength === 'medium') {
      return extractLength >= 121 && extractLength <= 220;
    }

    return extractLength >= 221;
  }

  private normalizeTitle(title: string): string {
    return title.replaceAll('_', ' ').trim().toLowerCase();
  }

  private shuffle<T>(items: T[]): T[] {
    return [...items].sort(() => Math.random() - 0.5);
  }

  private createWikipediaRequestUrl(params: URLSearchParams): string {
    return `https://${WIKIPEDIA_LANGUAGE_CODE}.wikipedia.org/w/api.php?${params.toString()}`;
  }

  private createWikipediaHtmlRequestUrl(pageTitle: string): string {
    return `https://${WIKIPEDIA_LANGUAGE_CODE}.wikipedia.org/w/rest.php/v1/page/${encodeURIComponent(
      pageTitle.replaceAll(' ', '_'),
    )}/html`;
  }

  private getPagesFromResponse(data: WikipediaApiResponse): WikipediaPage[] {
    return Object.values(data.query?.pages ?? {});
  }

  private mapPageToArticle(page: WikipediaPage): WikipediaArticle {
    return {
      extract: sanitizeWikipediaText(page.extract ?? ''),
      id: page.pageid,
      pageLength: page.length,
      thumbnailUrl: page.thumbnail?.source,
      title: sanitizeWikipediaText(page.title),
      url: page.fullurl ?? '',
    };
  }

  private async fetchWikipediaResponse(
    params: URLSearchParams,
  ): Promise<WikipediaApiResponse> {
    const response = await fetch(this.createWikipediaRequestUrl(params), {
      headers: this.createWikipediaHeaders(),
    });

    if (!response.ok) {
      throw new BadGatewayException('Failed to fetch Wikipedia content.');
    }

    return response.json() as Promise<WikipediaApiResponse>;
  }

  private async fetchWikipediaHtml(pageTitle: string): Promise<string> {
    const response = await fetch(
      this.createWikipediaHtmlRequestUrl(pageTitle),
      {
        headers: {
          ...this.createWikipediaHeaders(),
          Accept: 'text/html; charset=utf-8',
        },
      },
    );

    if (!response.ok) {
      throw new BadGatewayException('Failed to fetch Wikipedia article HTML.');
    }

    return response.text();
  }

  private createWikipediaHeaders(): Record<string, string> {
    return {
      'Api-User-Agent': WIKIMEDIA_USER_AGENT,
      'User-Agent': WIKIMEDIA_USER_AGENT,
    };
  }

  private createSimplificationChunks(params: {
    sourceBlocks?: ArticleBlock[];
    text: string;
  }): SimplificationChunk[] {
    if (params.sourceBlocks?.length) {
      return this.createBlockSimplificationChunks(params.sourceBlocks);
    }

    return this.createTextSimplificationChunks(params.text);
  }

  private createBlockSimplificationChunks(
    sourceBlocks: ArticleBlock[],
  ): SimplificationChunk[] {
    const splitBlocks = sourceBlocks.flatMap((block) =>
      this.splitOversizedBlock(block),
    );
    const chunkBlocks: ArticleBlock[][] = [];
    let currentBlocks: ArticleBlock[] = [];
    let currentLength = 0;

    const flushChunk = () => {
      if (currentBlocks.length === 0) {
        return;
      }

      chunkBlocks.push(currentBlocks);
      currentBlocks = [];
      currentLength = 0;
    };

    for (const block of splitBlocks) {
      const blockLength = this.getArticleBlockPromptText(block).length;

      if (
        currentBlocks.length > 0 &&
        currentLength + blockLength > MAX_SIMPLIFICATION_CHUNK_CHARS
      ) {
        flushChunk();
      }

      currentBlocks.push(block);
      currentLength += blockLength;
    }

    flushChunk();

    return chunkBlocks.map((blocks, index) => ({
      blocks,
      index: index + 1,
      text: this.extractPlainTextFromArticleBlocks(blocks),
      total: chunkBlocks.length,
    }));
  }

  private createTextSimplificationChunks(text: string): SimplificationChunk[] {
    const paragraphs = text
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    const chunks: string[] = [];
    let currentChunk = '';

    const appendTextPart = (part: string) => {
      if (!currentChunk) {
        currentChunk = part;
        return;
      }

      if (
        currentChunk.length + part.length + 2 >
        MAX_SIMPLIFICATION_CHUNK_CHARS
      ) {
        chunks.push(currentChunk);
        currentChunk = part;
        return;
      }

      currentChunk = `${currentChunk}\n\n${part}`;
    };

    for (const paragraph of paragraphs) {
      if (paragraph.length <= MAX_SIMPLIFICATION_CHUNK_CHARS) {
        appendTextPart(paragraph);
        continue;
      }

      for (const sentenceGroup of this.splitTextBySentences(paragraph)) {
        appendTextPart(sentenceGroup);
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.map((chunkText, index) => ({
      index: index + 1,
      text: chunkText,
      total: chunks.length,
    }));
  }

  private splitOversizedBlock(block: ArticleBlock): ArticleBlock[] {
    const blockLength = this.getArticleBlockPromptText(block).length;

    if (blockLength <= MAX_SIMPLIFICATION_CHUNK_CHARS) {
      return [block];
    }

    if (block.type === 'paragraph') {
      return this.splitTextBySentences(
        this.extractTextFromInlineNodes(block.children),
      ).map((text) => ({
        children: this.createPlainTextInlineNodes(text),
        type: 'paragraph',
      }));
    }

    if (block.type === 'list') {
      return block.items.map((item) => ({
        items: [item],
        ordered: block.ordered,
        type: 'list',
      }));
    }

    if (block.type === 'table') {
      const chunks: ArticleBlock[] = [];
      let currentRows: typeof block.rows = [];
      let currentLength = 0;

      for (const row of block.rows) {
        const rowLength = row.map((cell) => cell.text).join(' | ').length;

        if (
          currentRows.length > 0 &&
          currentLength + rowLength > MAX_SIMPLIFICATION_CHUNK_CHARS
        ) {
          chunks.push({ rows: currentRows, type: 'table' });
          currentRows = [];
          currentLength = 0;
        }

        currentRows.push(row);
        currentLength += rowLength;
      }

      if (currentRows.length > 0) {
        chunks.push({ rows: currentRows, type: 'table' });
      }

      return chunks;
    }

    return [block];
  }

  private splitTextBySentences(text: string): string[] {
    const sentences =
      text
        .match(/[^.!?\n]+(?:[.!?]+(?=\s|$)|$)/g)
        ?.map((sentence) => sentence.trim()) ?? [];

    if (sentences.length === 0) {
      return [text.slice(0, MAX_SIMPLIFICATION_CHUNK_CHARS)];
    }

    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const sentenceParts =
        sentence.length > MAX_SIMPLIFICATION_CHUNK_CHARS
          ? this.splitOversizedSentence(sentence)
          : [sentence];

      for (const sentencePart of sentenceParts) {
        if (!currentChunk) {
          currentChunk = sentencePart;
          continue;
        }

        if (
          currentChunk.length + sentencePart.length + 1 >
          MAX_SIMPLIFICATION_CHUNK_CHARS
        ) {
          chunks.push(currentChunk);
          currentChunk = sentencePart;
          continue;
        }

        currentChunk = `${currentChunk} ${sentencePart}`;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  private splitOversizedSentence(sentence: string): string[] {
    const words = sentence.split(/\s+/).filter(Boolean);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const word of words) {
      if (!currentChunk) {
        currentChunk = word;
        continue;
      }

      if (
        currentChunk.length + word.length + 1 >
        MAX_SIMPLIFICATION_CHUNK_CHARS
      ) {
        chunks.push(currentChunk);
        currentChunk = word;
        continue;
      }

      currentChunk = `${currentChunk} ${word}`;
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  private formatArticleBlocksForPrompt(blocks?: ArticleBlock[]): string {
    if (!blocks?.length) {
      return 'No structured source blocks were provided.';
    }

    return blocks
      .map((block, index) => {
        const sourceId = `source-${index + 1}`;

        if (block.type === 'image') {
          return JSON.stringify({
            alt: block.alt,
            caption: block.caption,
            sourceId,
            src: block.src,
            type: block.type,
          });
        }

        if (block.type === 'table') {
          return JSON.stringify({
            rows: block.rows,
            sourceId,
            type: block.type,
          });
        }

        if (block.type === 'heading') {
          return JSON.stringify({
            level: block.level,
            sourceId,
            text: block.text,
            type: block.type,
          });
        }

        if (block.type === 'formula') {
          return JSON.stringify({
            altText: block.altText,
            sourceId,
            type: block.type,
          });
        }

        return JSON.stringify({
          sourceId,
          text: this.getArticleBlockPromptText(block),
          type: block.type,
        });
      })
      .join('\n');
  }

  private getArticleBlockPromptText(block: ArticleBlock): string {
    if (block.type === 'heading') {
      return block.text.trim();
    }

    if (block.type === 'paragraph') {
      return this.extractTextFromInlineNodes(block.children);
    }

    if (block.type === 'list') {
      return block.items
        .map((item) => this.extractTextFromInlineNodes(item))
        .join('\n');
    }

    if (block.type === 'table') {
      return this.normalizeTableRows(block.rows)
        .map((row) => row.map((cell) => cell.text.trim()).join(' | '))
        .join('\n');
    }

    if (block.type === 'formula') {
      return block.altText.trim();
    }

    return [block.alt, block.caption].filter(Boolean).join(' ').trim();
  }

  private extractPlainTextFromArticleBlocks(blocks: ArticleBlock[]): string {
    return blocks
      .map((block) => this.getArticleBlockPromptText(block))
      .filter(Boolean)
      .join('\n\n')
      .trim();
  }

  private extractTextFromInlineNodes(nodes: { text: string }[]): string {
    return nodes
      .map((node) => node.text)
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private createPlainTextInlineNodes(
    text: string,
  ): { text: string; type: 'text' }[] {
    return [{ text, type: 'text' }];
  }

  private createChunkSimplificationPrompt(params: {
    chunk: SimplificationChunk;
    level: ArticleSimplificationLevel;
    targetPercent: ArticleSimplificationTargetPercent;
    title: string;
  }): string {
    return `Simplify this chunk of a longer English Wikipedia article.

Article title: ${params.title}
Chunk: ${params.chunk.index} of ${params.chunk.total}
Learner level: ${params.level}
${this.getSimplificationTargetLengthRule(params.targetPercent)}

Rules:
- Preserve meaning and local context.
- Do not add facts.
- Do not cut a sentence in the middle.
- Keep related ideas together.
- Use simple, natural English for level ${params.level}.
- Keep this chunk aligned with the final target length rule above.
- Return ONLY valid JSON with this schema:
  {
    "adaptedBlocks": ArticleBlock[]
  }
- You may keep images and tables only when they help understand this simplified chunk.
- If you keep an image, copy its "src" exactly from the source block.
- If you keep a table, keep only useful rows/cells from the source table and simplify labels if needed.
- Do not invent image URLs, table facts, or source values.
- Do not generate questions for this chunk.

Allowed ArticleBlock union:
- heading: { "type":"heading", "level":1|2|3, "text": string }
- paragraph: { "type":"paragraph", "children": InlineNode[] }
- list: { "type":"list", "ordered": boolean, "items": InlineNode[][] }
- table: { "type":"table", "rows": TableCell[][] }
- image: { "type":"image", "src": string, "alt"?: string, "caption"?: string }
InlineNode:
- { "type":"text", "text": string, "bold"?: boolean, "italic"?: boolean }
- { "type":"word", "text": string, "bold"?: boolean, "italic"?: boolean }
TableCell:
- { "text": string, "header"?: boolean }

Source blocks:
${this.formatArticleBlocksForPrompt(params.chunk.blocks)}

Source text:
${params.chunk.text}`;
  }

  private createSimplificationPrompt(params: {
    level: ArticleSimplificationLevel;
    sourceBlocks?: ArticleBlock[];
    targetPercent: ArticleSimplificationTargetPercent;
    text: string;
    title: string;
  }): string {
    const questionRule = this.getQuestionCountRule(params.targetPercent);

    return `You are helping to create educational English texts for language learners.

Simplify and shorten the following English Wikipedia article for a user with level ${params.level}.

Rules:
- Keep only the most important facts.
- Do not add facts that are not in the original text.
- Use simple and natural English.
- Adapt vocabulary and grammar to level ${params.level}.
- For A1/A2: use short sentences and common words.
- For B1: use moderately simple sentences.
- For B2: keep more details, but make the text clear.
- For C1: keep nuance and precision, but still improve readability.
- Avoid complex academic words where possible.
- If a difficult word is important, keep it but explain it simply.
- Make the text coherent, not just a list of sentences.
- ${this.getSimplificationTargetLengthRule(params.targetPercent)}
- Return a valid JSON object only, without markdown fences or extra text.
- JSON schema:
  {
    "adaptedBlocks": ArticleBlock[]
  }
- "adaptedBlocks" must follow this exact union:
  - heading: { "type":"heading", "level":1|2|3, "text": string }
  - paragraph: { "type":"paragraph", "children": InlineNode[] }
  - list: { "type":"list", "ordered": boolean, "items": InlineNode[][] }
  - table: { "type":"table", "rows": TableCell[][] }
  - image: { "type":"image", "src": string, "alt"?: string, "caption"?: string }
- InlineNode must be one of:
  - { "type":"text", "text": string, "bold"?: boolean, "italic"?: boolean }
  - { "type":"word", "text": string, "bold"?: boolean, "italic"?: boolean }
- TableCell must be { "text": string, "header"?: boolean }.
- Do not use "formula" blocks in adapted output.
- Keep headings/tables/images where they help comprehension.
- If source blocks are provided, use them to decide which source tables and images are useful.
- If you keep an image, copy its "src" exactly from the source image block.
- If you keep a table, keep only useful rows/cells from a source table and simplify labels if needed.
- Never invent image URLs or table values that are not supported by the source text.
- Generate comprehension questions for the adapted text.
- Question count: ${questionRule}.
- Allowed question types:
  - "single_choice": exactly 1 correct option.
  - "multiple_choice": 2 or more correct options.
  - "true_false": exactly 2 options ("True", "False"), exactly 1 correct option.
- Questions must match learner level ${params.level}.
- Keep wording simple for A1/A2, moderate for B1, richer but clear for B2, and nuanced but natural for C1.
- Every question must be answerable only from adapted text.
- Extend JSON schema with:
  "questions": [
    {
      "id": string,
      "type": "single_choice" | "multiple_choice" | "true_false",
      "prompt": string,
      "options": [{ "id": string, "text": string }],
      "correctOptionIds": string[],
      "explanation"?: string
    }
  ]

Title:
${params.title}

Source blocks:
${this.formatArticleBlocksForPrompt(params.sourceBlocks)}

Original text:
${params.text}`;
  }

  private createQuizPrompt(params: {
    level: ArticleSimplificationLevel;
    targetLength?: ArticleSimplificationTargetLength;
    targetPercent?: ArticleSimplificationTargetPercent;
    text: string;
    title: string;
  }): string {
    const questionRule = this.getQuestionCountRule(
      params.targetPercent ?? params.targetLength ?? DEFAULT_TARGET_LENGTH,
    );

    return `Generate a reading-comprehension quiz for the article below.

Rules:
- Language: English.
- Learner level: ${params.level}.
- Question count: ${questionRule}.
- Allowed question types:
  - "single_choice": exactly 1 correct option.
  - "multiple_choice": 2 or more correct options.
  - "true_false": exactly 2 options ("True", "False"), exactly 1 correct option.
- Questions must be answerable from the article text only.
- Do not invent facts.
- For A1/A2 use simpler vocabulary and shorter prompts.
- For B1 moderate complexity; for B2 richer but clear wording; for C1 allow more nuance while staying clear.
- Return ONLY valid JSON:
{
  "questions": [
    {
      "id": string,
      "type": "single_choice" | "multiple_choice" | "true_false",
      "prompt": string,
      "options": [{ "id": string, "text": string }],
      "correctOptionIds": string[],
      "explanation"?: string
    }
  ]
}

Title:
${params.title}

Text:
${params.text}`;
  }

  private createVocabularyQuizPrompt(params: {
    level?: ArticleSimplificationLevel;
    targetQuestionCount: number;
    text: string;
    title: string;
  }): string {
    const learnerLevelRule = params.level
      ? `- Learner level is fixed at ${params.level}. Set "resolvedLevel" to "${params.level}".`
      : '- If learner level is not provided, estimate it and set "resolvedLevel" to one of "A1", "A2", "B1", "B2", "C1".';

    return `Generate a vocabulary quiz from the article below.

Rules:
- Focus on vocabulary that is important for understanding the article's topic, process, or main ideas.
- Select target terms only from the source text. Each target term must appear verbatim in the text.
- Prefer meaningful topic words and short useful phrases or phrasal expressions.
- Do not select articles, pronouns, prepositions, auxiliary verbs, isolated numbers, obvious function words, or proper names unless a name is essential to understanding the topic.
- Allowed target terms: one word or one short phrase of up to 5 words.
${learnerLevelRule}
- Respect learner level when choosing target terms. For lower levels, prefer simpler but still meaningful vocabulary from the text.
- Aim for ${params.targetQuestionCount} questions. Use fewer only if the text truly has too few suitable target terms. Never exceed ${params.targetQuestionCount}.
- Minimum quality matters more than quantity.
- Each question must test exactly one target term.
- Use only "single_choice" questions with exactly 4 options and exactly 1 correct option.
- Use a natural mix of these formats when appropriate:
  - "translation": choose the best Ukrainian translation of the target term.
  - "definition": choose the English definition that best matches the term in this text.
  - "cloze": complete a sentence from the text or a very similar context with the correct term.
  - "synonym": choose the closest English synonym or near-meaning when that is natural.
- Do not force all formats if they do not fit the selected vocabulary.
- Wrong options must be plausible, not silly.
- Do not invent target terms that are missing from the text. Only distractors may be invented.
- For "cloze", hide the term with "____".
- Keep prompts concise.
- Keep option texts short where possible.
- "sourceExcerpt" should be a short excerpt from the source text that contains the term, ideally no more than 12 words.
- Return ONLY valid JSON:
{
  "resolvedLevel": "A1" | "A2" | "B1" | "B2" | "C1",
  "questions": [
    {
      "id": string,
      "type": "single_choice",
      "format": "translation" | "definition" | "cloze" | "synonym",
      "term": string,
      "termKind": "word" | "phrase",
      "prompt": string,
      "sourceExcerpt": string,
      "options": [{ "id": string, "text": string }],
      "correctOptionIds": string[],
      "explanation"?: string
    }
  ]
}

Title:
${params.title}

Text:
${params.text}`;
  }

  private getSimplificationTargetLengthRule(
    targetPercent: ArticleSimplificationTargetPercent,
  ): string {
    if (targetPercent === 100) {
      return 'Target length: keep approximately the original length. Preserve all important content and simplify vocabulary, grammar, and sentence structure without summarizing.';
    }

    return `Target length: about ${targetPercent}% of the original article.`;
  }

  private parseSimplificationModelResponse(
    rawResponse: string,
  ): SimplificationModelResponse {
    if (!rawResponse) {
      return { adaptedBlocks: [] };
    }

    const normalized = rawResponse
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    try {
      const parsed = JSON.parse(normalized) as {
        adaptedBlocks?: unknown;
        questions?: unknown;
      };
      const adaptedBlocks = this.normalizeArticleBlocks(parsed.adaptedBlocks);
      const questions = this.normalizeQuestions(parsed.questions);

      if (adaptedBlocks.length > 0) {
        return {
          adaptedBlocks,
          questions: questions.length > 0 ? questions : undefined,
        };
      }
    } catch {
      // Invalid JSON is handled as an unavailable structured response.
    }

    return { adaptedBlocks: [] };
  }

  private normalizeArticleBlocks(rawBlocks: unknown): ArticleBlock[] {
    if (!Array.isArray(rawBlocks)) {
      return [];
    }

    return rawBlocks
      .map((block) => this.normalizeArticleBlock(block))
      .filter((block): block is ArticleBlock => block !== null);
  }

  private normalizeArticleBlock(rawBlock: unknown): ArticleBlock | null {
    if (!rawBlock || typeof rawBlock !== 'object') {
      return null;
    }

    const candidate = rawBlock as Record<string, unknown>;
    const type = candidate.type;

    if (type === 'heading') {
      const text = this.getStringValue(candidate.text);
      const level =
        candidate.level === 1 || candidate.level === 2 || candidate.level === 3
          ? candidate.level
          : 2;

      return text ? { level, text, type } : null;
    }

    if (type === 'paragraph') {
      const children = this.normalizeInlineNodes(candidate.children);
      const fallbackText = this.getStringValue(candidate.text);

      if (children.length > 0) {
        return { children, type };
      }

      return fallbackText
        ? { children: this.createPlainTextInlineNodes(fallbackText), type }
        : null;
    }

    if (type === 'list') {
      const rawItems = Array.isArray(candidate.items) ? candidate.items : [];
      const items = rawItems
        .map((item) => this.normalizeInlineNodes(item))
        .filter((item) => item.length > 0);

      return items.length > 0
        ? { items, ordered: candidate.ordered === true, type }
        : null;
    }

    if (type === 'table') {
      const rows = this.normalizeTableRows(candidate.rows);

      return rows.length > 0 ? { rows, type } : null;
    }

    if (type === 'formula') {
      const altText = this.getStringValue(candidate.altText);

      return altText
        ? {
            altText,
            display: candidate.display !== false,
            type,
          }
        : null;
    }

    if (type === 'image') {
      const src = this.getStringValue(candidate.src);

      return src
        ? {
            alt: this.getStringValue(candidate.alt) || undefined,
            caption: this.getStringValue(candidate.caption) || undefined,
            src,
            type,
          }
        : null;
    }

    return null;
  }

  private normalizeInlineNodes(rawNodes: unknown): { text: string; type: 'text' }[] {
    if (typeof rawNodes === 'string') {
      return this.createPlainTextInlineNodes(rawNodes);
    }

    if (!Array.isArray(rawNodes)) {
      return [];
    }

    return rawNodes
      .map((node) => {
        if (typeof node === 'string') {
          return { text: node.trim(), type: 'text' as const };
        }

        if (!node || typeof node !== 'object') {
          return null;
        }

        const text = this.getStringValue((node as Record<string, unknown>).text);

        return text ? { text, type: 'text' as const } : null;
      })
      .filter((node): node is { text: string; type: 'text' } => node !== null);
  }

  private normalizeTableRows(rawRows: unknown): TableCell[][] {
    if (!Array.isArray(rawRows)) {
      return [];
    }

    return rawRows
      .map((row) => this.normalizeTableRow(row))
      .filter((row) => row.length > 0);
  }

  private normalizeTableRow(rawRow: unknown): TableCell[] {
    if (Array.isArray(rawRow)) {
      return rawRow
        .map((cell) => this.normalizeTableCell(cell))
        .filter((cell): cell is TableCell => cell !== null);
    }

    if (!rawRow || typeof rawRow !== 'object') {
      const cell = this.normalizeTableCell(rawRow);

      return cell ? [cell] : [];
    }

    const candidate = rawRow as Record<string, unknown>;

    if (Array.isArray(candidate.cells)) {
      return this.normalizeTableRow(candidate.cells);
    }

    return Object.values(candidate)
      .map((cell) => this.normalizeTableCell(cell))
      .filter((cell): cell is TableCell => cell !== null);
  }

  private normalizeTableCell(rawCell: unknown): TableCell | null {
    const text =
      typeof rawCell === 'string' || typeof rawCell === 'number'
        ? String(rawCell).trim()
        : rawCell && typeof rawCell === 'object'
          ? this.getStringValue(
              (rawCell as Record<string, unknown>).text ??
                (rawCell as Record<string, unknown>).value ??
                (rawCell as Record<string, unknown>).content,
            )
          : '';

    if (!text) {
      return null;
    }

    return {
      header:
        rawCell && typeof rawCell === 'object'
          ? (rawCell as Record<string, unknown>).header === true || undefined
          : undefined,
      text,
    };
  }

  private getStringValue(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private parseQuizModelResponse(rawResponse: string): ArticleQuizQuestion[] {
    if (!rawResponse) {
      return [];
    }

    const normalized = this.stripJsonMarkdownFences(rawResponse);

    try {
      const parsed = JSON.parse(normalized) as { questions?: unknown };
      return this.normalizeQuestions(parsed.questions);
    } catch {
      return [];
    }
  }

  private parseVocabularyQuizModelResponse(params: {
    rawResponse: string;
    requestedLevel?: ArticleSimplificationLevel;
    sourceText: string;
    targetQuestionCount: number;
  }): GenerateArticleVocabularyQuizResponse & { diagnostics: string[] } {
    const fallbackLevel =
      params.requestedLevel ?? this.inferLevelFromText(params.sourceText);

    if (!params.rawResponse) {
      return {
        diagnostics: ['AI response was empty.'],
        questions: [],
        resolvedLevel: fallbackLevel,
      };
    }

    const parsedJson = this.parseJsonObject<{
      questions?: unknown;
      resolvedLevel?: unknown;
    }>(params.rawResponse);

    if (!parsedJson.parsed) {
      return {
        diagnostics: parsedJson.diagnostics,
        questions: [],
        resolvedLevel: fallbackLevel,
      };
    }

    const parsed = parsedJson.parsed;
    const resolvedLevel =
      params.requestedLevel ??
      this.normalizeResolvedLevel(parsed.resolvedLevel) ??
      fallbackLevel;
    const normalizedQuestions = this.normalizeVocabularyQuestions(
      parsed.questions,
      {
        sourceText: params.sourceText,
        targetQuestionCount: params.targetQuestionCount,
      },
    );

    return {
      diagnostics: [
        ...parsedJson.diagnostics,
        typeof parsed.resolvedLevel === 'string'
          ? `AI resolvedLevel="${parsed.resolvedLevel}".`
          : 'AI resolvedLevel is missing or invalid.',
        ...normalizedQuestions.diagnostics,
      ],
      questions: normalizedQuestions.questions,
      resolvedLevel,
    };
  }

  private stripJsonMarkdownFences(value: string): string {
    return value
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }

  private parseJsonObject<T>(rawResponse: string): {
    diagnostics: string[];
    parsed?: T;
  } {
    const normalized = this.stripJsonMarkdownFences(rawResponse);

    try {
      return {
        diagnostics: [],
        parsed: JSON.parse(normalized) as T,
      };
    } catch (error) {
      const diagnostics = [
        `Failed to parse AI response as JSON: ${error instanceof Error ? error.message : 'Unknown parse error'}.`,
        this.describeJsonParseError(error, normalized),
      ].filter(Boolean) as string[];
      const repaired = this.repairCommonJsonIssues(normalized);

      if (repaired !== normalized) {
        try {
          return {
            diagnostics: [
              ...diagnostics,
              'Applied JSON repair: removed trailing commas before closing brackets/braces.',
            ],
            parsed: JSON.parse(repaired) as T,
          };
        } catch (repairError) {
          const partialRecovery = this.tryRecoverVocabularyQuizFromPartialJson<T>(
            repaired,
          );

          if (partialRecovery.parsed) {
            return {
              diagnostics: [
                ...diagnostics,
                `JSON repair parse still failed: ${repairError instanceof Error ? repairError.message : 'Unknown parse error'}.`,
                this.describeJsonParseError(repairError, repaired) ?? '',
                ...partialRecovery.diagnostics,
              ].filter(Boolean) as string[],
              parsed: partialRecovery.parsed,
            };
          }

          return {
            diagnostics: [
              ...diagnostics,
              `JSON repair parse still failed: ${repairError instanceof Error ? repairError.message : 'Unknown parse error'}.`,
              this.describeJsonParseError(repairError, repaired),
            ].filter(Boolean) as string[],
          };
        }
      }

      const partialRecovery =
        this.tryRecoverVocabularyQuizFromPartialJson<T>(normalized);

      if (partialRecovery.parsed) {
        return {
          diagnostics: [...diagnostics, ...partialRecovery.diagnostics],
          parsed: partialRecovery.parsed,
        };
      }

      return { diagnostics };
    }
  }

  private tryRecoverVocabularyQuizFromPartialJson<T>(value: string): {
    diagnostics: string[];
    parsed?: T;
  } {
    const resolvedLevel = this.extractResolvedLevelFromRawResponse(value);
    const questionObjects = this.extractCompleteQuestionObjects(value);

    if (questionObjects.length === 0) {
      return {
        diagnostics: [
          'Partial JSON recovery failed: no complete question objects were found.',
        ],
      };
    }

    const parsedQuestions = questionObjects.flatMap((questionObject, index) => {
      try {
        return [JSON.parse(questionObject) as Record<string, unknown>];
      } catch (error) {
        this.logger.warn(
          `Skipped partially recovered question ${index + 1}: ${error instanceof Error ? error.message : 'Unknown parse error'}`,
        );
        return [];
      }
    });

    if (parsedQuestions.length === 0) {
      return {
        diagnostics: [
          'Partial JSON recovery failed: complete question objects were found, but none parsed successfully.',
        ],
      };
    }

    return {
      diagnostics: [
        `Recovered ${parsedQuestions.length} complete question objects from truncated AI response.`,
        resolvedLevel
          ? `Recovered resolvedLevel="${resolvedLevel}" from truncated AI response.`
          : 'Could not recover resolvedLevel from truncated AI response.',
      ],
      parsed: {
        questions: parsedQuestions,
        resolvedLevel,
      } as T,
    };
  }

  private repairCommonJsonIssues(value: string): string {
    return value
      .replace(/,\s*([}\]])/g, '$1')
      .trim();
  }

  private extractResolvedLevelFromRawResponse(
    value: string,
  ): ArticleSimplificationLevel | null {
    const match = value.match(/"resolvedLevel"\s*:\s*"(A1|A2|B1|B2|C1)"/i);

    if (!match) {
      return null;
    }

    const candidateLevel = match[1]?.toUpperCase();
    return candidateLevel && this.isSimplificationLevel(candidateLevel)
      ? candidateLevel
      : null;
  }

  private extractCompleteQuestionObjects(value: string): string[] {
    const questionsKeyIndex = value.indexOf('"questions"');

    if (questionsKeyIndex < 0) {
      return [];
    }

    const arrayStartIndex = value.indexOf('[', questionsKeyIndex);

    if (arrayStartIndex < 0) {
      return [];
    }

    const questionObjects: string[] = [];
    let inString = false;
    let isEscaped = false;
    let objectDepth = 0;
    let objectStartIndex = -1;

    for (let index = arrayStartIndex + 1; index < value.length; index += 1) {
      const character = value[index];

      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (character === '\\') {
        isEscaped = true;
        continue;
      }

      if (character === '"') {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (character === '{') {
        if (objectDepth === 0) {
          objectStartIndex = index;
        }

        objectDepth += 1;
        continue;
      }

      if (character === '}') {
        if (objectDepth === 0) {
          continue;
        }

        objectDepth -= 1;

        if (objectDepth === 0 && objectStartIndex >= 0) {
          questionObjects.push(value.slice(objectStartIndex, index + 1));
          objectStartIndex = -1;
        }

        continue;
      }

      if (character === ']' && objectDepth === 0) {
        break;
      }
    }

    return questionObjects;
  }

  private describeJsonParseError(error: unknown, value: string): string | null {
    if (!(error instanceof Error)) {
      return null;
    }

    const positionMatch = error.message.match(/position (\d+)/i);
    const position = positionMatch ? Number(positionMatch[1]) : NaN;

    if (!Number.isFinite(position)) {
      return null;
    }

    const contextRadius = 120;
    const start = Math.max(0, position - contextRadius);
    const end = Math.min(value.length, position + contextRadius);
    const snippet = value
      .slice(start, end)
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n');

    return `JSON parse context around position ${position}: ${snippet}`;
  }

  private getVocabularyQuestionTarget(text: string): number {
    const wordCount = this.countWords(text);

    if (wordCount <= 180) {
      return 5;
    }

    if (wordCount <= 420) {
      return 7;
    }

    if (wordCount <= 750) {
      return 10;
    }

    if (wordCount <= 1100) {
      return 12;
    }

    return 15;
  }

  private getQuestionCountRule(
    targetLength:
      | ArticleSimplificationTargetLength
      | ArticleSimplificationTargetPercent,
  ): string {
    if (targetLength === 'short' || targetLength === 10) {
      return 'exactly 3 questions';
    }

    if (targetLength === 'medium' || targetLength === 25) {
      return '4 to 5 questions';
    }

    return 'at least 6 questions';
  }

  private normalizeQuestions(rawQuestions: unknown): ArticleQuizQuestion[] {
    if (!Array.isArray(rawQuestions)) {
      return [];
    }

    return rawQuestions
      .map((question, index) => this.normalizeQuestion(question, index))
      .filter((question): question is ArticleQuizQuestion => question !== null);
  }

  private normalizeQuestion(
    rawQuestion: unknown,
    index: number,
  ): ArticleQuizQuestion | null {
    if (!rawQuestion || typeof rawQuestion !== 'object') {
      return null;
    }

    const candidate = rawQuestion as {
      correctOptionIds?: unknown;
      explanation?: unknown;
      id?: unknown;
      options?: unknown;
      prompt?: unknown;
      type?: unknown;
    };
    const prompt =
      typeof candidate.prompt === 'string' ? candidate.prompt.trim() : '';
    const type = this.normalizeQuestionType(candidate.type);
    const options = this.normalizeQuestionOptions(candidate.options);
    const correctOptionIds = this.normalizeCorrectOptionIds(
      candidate.correctOptionIds,
      options,
      type,
    );

    if (
      !prompt ||
      !type ||
      options.length < 2 ||
      correctOptionIds.length === 0
    ) {
      return null;
    }

    if (type === 'true_false') {
      const hasTrueOption = options.some(
        (option) => option.text.trim().toLowerCase() === 'true',
      );
      const hasFalseOption = options.some(
        (option) => option.text.trim().toLowerCase() === 'false',
      );

      if (!hasTrueOption || !hasFalseOption || options.length !== 2) {
        return null;
      }
    }

    if (type === 'single_choice' && correctOptionIds.length !== 1) {
      return null;
    }

    if (type === 'multiple_choice' && correctOptionIds.length < 2) {
      return null;
    }

    const id =
      typeof candidate.id === 'string' && candidate.id.trim()
        ? candidate.id.trim()
        : `q-${index + 1}`;
    const explanation =
      typeof candidate.explanation === 'string' &&
      candidate.explanation.trim().length > 0
        ? candidate.explanation.trim()
        : undefined;

    return {
      correctOptionIds,
      explanation,
      id,
      options,
      prompt,
      type,
    };
  }

  private normalizeVocabularyQuestions(
    rawQuestions: unknown,
    params: {
      sourceText: string;
      targetQuestionCount: number;
    },
  ): {
    diagnostics: string[];
    questions: ArticleVocabularyQuizQuestion[];
  } {
    if (!Array.isArray(rawQuestions)) {
      return {
        diagnostics: ['`questions` is not an array.'],
        questions: [],
      };
    }

    const usedTerms = new Set<string>();
    const diagnostics: string[] = [];
    const questions: ArticleVocabularyQuizQuestion[] = [];

    rawQuestions.forEach((question, index) => {
      const normalizedQuestion = this.normalizeVocabularyQuestion(
        question,
        index,
        params.sourceText,
      );

      if (!normalizedQuestion) {
        diagnostics.push(`Question ${index + 1} was rejected.`);
        return;
      }

      if ('reason' in normalizedQuestion) {
        diagnostics.push(
          `Question ${index + 1} was rejected: ${normalizedQuestion.reason}`,
        );
        return;
      }

      const normalizedTerm = this.normalizeTextForSourceMatch(
        normalizedQuestion.question.term,
      );

      if (usedTerms.has(normalizedTerm)) {
        diagnostics.push(
          `Question ${index + 1} was rejected because term "${normalizedQuestion.question.term}" is duplicated.`,
        );
        return;
      }

      usedTerms.add(normalizedTerm);
      questions.push(normalizedQuestion.question);
    });

    if (questions.length > params.targetQuestionCount) {
      diagnostics.push(
        `AI returned ${questions.length} valid questions, trimmed to ${params.targetQuestionCount}.`,
      );
    }

    return {
      diagnostics,
      questions: questions.slice(0, params.targetQuestionCount),
    };
  }

  private normalizeVocabularyQuestion(
    rawQuestion: unknown,
    index: number,
    sourceText: string,
  ): {
    question: ArticleVocabularyQuizQuestion;
  } | {
    reason: string;
  } | null {
    if (!rawQuestion || typeof rawQuestion !== 'object') {
      return { reason: 'question is not an object' };
    }

    const candidate = rawQuestion as {
      correctOptionIds?: unknown;
      explanation?: unknown;
      format?: unknown;
      id?: unknown;
      options?: unknown;
      prompt?: unknown;
      sourceExcerpt?: unknown;
      term?: unknown;
      termKind?: unknown;
      type?: unknown;
    };
    const prompt = this.getStringValue(candidate.prompt);
    const term = this.getStringValue(candidate.term);
    const format = this.normalizeVocabularyQuestionFormat(candidate.format);
    const inferredTermKind =
      this.normalizeVocabularyTermKind(candidate.termKind) ??
      (term.includes(' ') ? 'phrase' : 'word');
    const sourceExcerpt = this.getStringValue(candidate.sourceExcerpt);
    const type =
      candidate.type === 'single_choice' || candidate.type === undefined
        ? 'single_choice'
        : null;
    const options = this.normalizeQuestionOptions(candidate.options);
    const correctOptionIds = this.normalizeCorrectOptionIds(
      candidate.correctOptionIds,
      options,
      type,
    );

    if (!prompt) {
      return { reason: 'prompt is empty' };
    }

    if (!term) {
      return { reason: 'term is empty' };
    }

    if (!format) {
      return { reason: 'format is missing or invalid' };
    }

    if (!type) {
      return { reason: 'type must be "single_choice"' };
    }

    if (options.length !== 4) {
      return {
        reason: `expected exactly 4 options, got ${options.length}`,
      };
    }

    if (correctOptionIds.length !== 1) {
      return {
        reason: `expected exactly 1 correct option id, got ${correctOptionIds.length}`,
      };
    }

    if (!this.isUsefulVocabularyTerm(term)) {
      return {
        reason: `term "${term}" is not useful vocabulary for the quiz`,
      };
    }

    if (!this.sourceTextContainsTerm(sourceText, term)) {
      return {
        reason: `term "${term}" is not present in the source text`,
      };
    }

    if (this.hasDuplicateOptionTexts(options)) {
      return {
        reason: `options contain duplicate texts for term "${term}"`,
      };
    }

    const id =
      typeof candidate.id === 'string' && candidate.id.trim()
        ? candidate.id.trim()
        : `vq-${index + 1}`;
    const explanation =
      typeof candidate.explanation === 'string' &&
      candidate.explanation.trim().length > 0
        ? candidate.explanation.trim()
        : undefined;

    return {
      question: {
        correctOptionIds,
        explanation,
        format,
        id,
        options,
        prompt,
        sourceExcerpt: sourceExcerpt || undefined,
        term,
        termKind: inferredTermKind,
        type,
      },
    };
  }

  private truncateForLog(value: string, maxLength = 4000): string {
    return value.length > maxLength
      ? `${value.slice(0, maxLength)}... [truncated ${value.length - maxLength} chars]`
      : value;
  }

  private normalizeQuestionType(type: unknown): ArticleQuizQuestionType | null {
    if (
      type === 'single_choice' ||
      type === 'multiple_choice' ||
      type === 'true_false'
    ) {
      return type;
    }

    return null;
  }

  private normalizeQuestionOptions(
    rawOptions: unknown,
  ): ArticleQuizQuestionOption[] {
    if (!Array.isArray(rawOptions)) {
      return [];
    }

    return rawOptions
      .map((option, index) => {
        if (!option || typeof option !== 'object') {
          return null;
        }

        const candidate = option as { id?: unknown; text?: unknown };
        const text =
          typeof candidate.text === 'string' ? candidate.text.trim() : '';

        if (!text) {
          return null;
        }

        const id =
          typeof candidate.id === 'string' && candidate.id.trim()
            ? candidate.id.trim()
            : `o-${index + 1}`;

        return { id, text };
      })
      .filter((option): option is ArticleQuizQuestionOption => option !== null);
  }

  private normalizeCorrectOptionIds(
    rawCorrectOptionIds: unknown,
    options: ArticleQuizQuestionOption[],
    type: ArticleQuizQuestionType | null,
  ): string[] {
    if (!type || !Array.isArray(rawCorrectOptionIds)) {
      return [];
    }

    const optionIds = new Set(options.map((option) => option.id));
    const uniqueValidIds = Array.from(
      new Set(
        rawCorrectOptionIds.filter(
          (id): id is string =>
            typeof id === 'string' && id.trim().length > 0 && optionIds.has(id),
        ),
      ),
    );

    return uniqueValidIds;
  }

  private normalizeVocabularyQuestionFormat(
    format: unknown,
  ): ArticleVocabularyQuizQuestionFormat | null {
    if (
      format === 'translation' ||
      format === 'definition' ||
      format === 'cloze' ||
      format === 'synonym'
    ) {
      return format;
    }

    return null;
  }

  private normalizeVocabularyTermKind(
    termKind: unknown,
  ): ArticleVocabularyQuizTermKind | null {
    if (termKind === 'word' || termKind === 'phrase') {
      return termKind;
    }

    return null;
  }

  private normalizeResolvedLevel(
    level: unknown,
  ): ArticleSimplificationLevel | null {
    if (typeof level !== 'string') {
      return null;
    }

    const normalizedLevel = level.trim().toUpperCase();

    return this.isSimplificationLevel(normalizedLevel) ? normalizedLevel : null;
  }

  private isUsefulVocabularyTerm(term: string): boolean {
    const normalizedTerm = this.normalizeTextForSourceMatch(term);

    if (!normalizedTerm || normalizedTerm.length < 2) {
      return false;
    }

    const tokens = normalizedTerm.split(' ').filter(Boolean);

    if (tokens.length === 0 || tokens.length > 5) {
      return false;
    }

    if (!/[a-z]/.test(normalizedTerm)) {
      return false;
    }

    if (tokens.every((token) => VOCABULARY_QUIZ_STOPWORDS.has(token))) {
      return false;
    }

    return true;
  }

  private hasDuplicateOptionTexts(options: ArticleQuizQuestionOption[]): boolean {
    const normalizedOptions = options.map((option) =>
      option.text.trim().toLowerCase(),
    );

    return new Set(normalizedOptions).size !== normalizedOptions.length;
  }

  private sourceTextContainsTerm(sourceText: string, term: string): boolean {
    const normalizedSource = ` ${this.normalizeTextForSourceMatch(sourceText)} `;
    const normalizedTerm = this.normalizeTextForSourceMatch(term);

    if (!normalizedTerm) {
      return false;
    }

    return normalizedSource.includes(` ${normalizedTerm} `);
  }

  private normalizeTextForSourceMatch(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9'\s-]+/g, ' ')
      .replace(/[-\s]+/g, ' ')
      .trim();
  }

  private countWords(text: string): number {
    const matches = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g);
    return matches?.length ?? 0;
  }

  private inferLevelFromText(text: string): ArticleSimplificationLevel {
    const words: string[] = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
    const sentences = text
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    const wordCount = words.length;
    const averageWordLength =
      wordCount > 0
        ? words.reduce((total, word) => total + word.length, 0) / wordCount
        : 0;
    const averageSentenceLength =
      sentences.length > 0 ? wordCount / sentences.length : wordCount;

    if (averageSentenceLength <= 10 && averageWordLength <= 4.3) {
      return 'A1';
    }

    if (averageSentenceLength <= 13 && averageWordLength <= 4.8) {
      return 'A2';
    }

    if (averageSentenceLength <= 18 && averageWordLength <= 5.4) {
      return 'B1';
    }

    if (averageSentenceLength <= 24 && averageWordLength <= 6) {
      return 'B2';
    }

    return 'C1';
  }

  private createSimplificationCacheKey(params: {
    articleId?: number;
    level: ArticleSimplificationLevel;
    sourceHash: string;
    targetPercent: ArticleSimplificationTargetPercent;
    title: string;
  }): string {
    const digest = createHash('sha256')
      .update(
        `${params.articleId ?? 'no-id'}::${params.title}::${params.level}::${params.targetPercent}::${params.sourceHash}`,
      )
      .digest('hex');

    return `${params.level}::${params.targetPercent}::${digest}`;
  }

  private createSourceHash(params: {
    sourceBlocks?: ArticleBlock[];
    text: string;
    title: string;
  }): string {
    return createHash('sha256')
      .update(
        `${params.title}::${params.text}::${params.sourceBlocks ? JSON.stringify(params.sourceBlocks) : ''}`,
      )
      .digest('hex');
  }

  private async getMissingTargetPercents(params: {
    articleId?: number;
    level: ArticleSimplificationLevel;
    requestedTargetPercent: ArticleSimplificationTargetPercent;
    sourceHash: string;
    title: string;
  }): Promise<ArticleSimplificationTargetPercent[]> {
    return [params.requestedTargetPercent];
  }

  private async getCachedSimplification(
    cacheKey: string,
  ): Promise<SimplifyArticleResponse | null> {
    const result = await this.databaseService.query<SimplifiedArticleCacheRow>(
      `
        SELECT
          title,
          level,
          target_percent,
          original_length,
          adapted_blocks,
          adapted_text,
          adapted_length,
          questions
        FROM article_simplifications
        WHERE cache_key = $1
      `,
      [cacheKey],
    );
    const row = result.rows[0];

    if (!row) {
      return null;
    }

    const adaptedBlocks = this.normalizeCachedAdaptedBlocks(row);

    if (adaptedBlocks.length === 0) {
      return null;
    }

    return {
      adaptedLength: row.adapted_length,
      adaptedBlocks,
      level: row.level as ArticleSimplificationLevel,
      originalLength: row.original_length,
      questions: Array.isArray(row.questions) ? row.questions : undefined,
      targetPercent:
        this.normalizeTargetPercent(row.target_percent) ??
        DEFAULT_TARGET_PERCENT,
      title: row.title,
    };
  }

  private normalizeCachedAdaptedBlocks(
    row: SimplifiedArticleCacheRow,
  ): ArticleBlock[] {
    if (Array.isArray(row.adapted_blocks)) {
      return row.adapted_blocks;
    }

    if (row.adapted_text?.trim()) {
      return [
        {
          children: [{ text: row.adapted_text.trim(), type: 'text' }],
          type: 'paragraph',
        },
      ];
    }

    return [];
  }

  private async storeSimplification(params: {
    articleId?: number;
    cacheKey: string;
    response: SimplifyArticleResponse;
    sourceHash: string;
  }): Promise<void> {
    const adaptedText = this.extractPlainTextFromArticleBlocks(
      params.response.adaptedBlocks,
    );

    await this.databaseService.query(
      `
        INSERT INTO article_simplifications (
          cache_key,
          article_id,
          title,
          level,
          target_length,
          target_percent,
          source_hash,
          original_length,
          adapted_text,
          adapted_blocks,
          questions,
          adapted_length
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12)
        ON CONFLICT (cache_key) DO UPDATE
        SET
          title = EXCLUDED.title,
          article_id = EXCLUDED.article_id,
          level = EXCLUDED.level,
          target_length = EXCLUDED.target_length,
          target_percent = EXCLUDED.target_percent,
          source_hash = EXCLUDED.source_hash,
          original_length = EXCLUDED.original_length,
          adapted_text = EXCLUDED.adapted_text,
          adapted_blocks = EXCLUDED.adapted_blocks,
          questions = EXCLUDED.questions,
          adapted_length = EXCLUDED.adapted_length
      `,
      [
        params.cacheKey,
        params.articleId,
        params.response.title,
        params.response.level,
        String(params.response.targetPercent),
        params.response.targetPercent,
        params.sourceHash,
        params.response.originalLength,
        adaptedText,
        JSON.stringify(params.response.adaptedBlocks),
        params.response.questions
          ? JSON.stringify(params.response.questions)
          : null,
        params.response.adaptedLength,
      ],
    );
  }

  private normalizeTargetPercent(
    targetPercent: number | undefined,
  ): ArticleSimplificationTargetPercent | null {
    if (
      targetPercent === 10 ||
      targetPercent === 25 ||
      targetPercent === 50 ||
      targetPercent === 75 ||
      targetPercent === 100
    ) {
      return targetPercent;
    }

    return null;
  }

  private isSimplificationLevel(
    level: string,
  ): level is ArticleSimplificationLevel {
    return (
      level === 'A1' ||
      level === 'A2' ||
      level === 'B1' ||
      level === 'B2' ||
      level === 'C1'
    );
  }
}
