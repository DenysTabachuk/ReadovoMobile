import { BadGatewayException, Injectable } from '@nestjs/common';

import {
  getCategoryDiscoveryTerm,
  getCategorySearchQuery,
  isExcludedWikipediaTitle,
  MAX_ARTICLE_LIMIT,
  selectRecommendedArticleTitles,
} from './article-catalog';
import { ArticleFormulaRenderer } from './article-formula-renderer';
import {
  extractPlainTextFromBlocks,
  parseHtmlToBlocks,
  sanitizeWikipediaText,
} from './article-html-parser';
import {
  type ArticleReadyLevelFilter,
  type ArticleReadyTransformationFilter,
  type WikipediaApiResponse,
  type WikipediaArticle,
  type WikipediaArticleCategory,
  type WikipediaArticleDetail,
  type WikipediaArticlePreviewLength,
  type WikipediaArticleSortOption,
  type WikipediaPage,
} from '../contracts/types';

const DEFAULT_ARTICLE_LIMIT = 20;
const DEFAULT_LANGUAGE_CODE = 'en';
const WIKIMEDIA_USER_AGENT = 'Readovo/1.0';

type ArticleDiscoveryParams = {
  category: WikipediaArticleCategory;
  excludeIds: number[];
  limit: number;
  previewLength: WikipediaArticlePreviewLength;
  recommended: boolean;
  search?: string;
};

type ArticlePresentationParams = {
  limit: number;
  preferImagesFirst: boolean;
  readyLevel: ArticleReadyLevelFilter;
  readyTransformationType: ArticleReadyTransformationFilter;
  sortBy: WikipediaArticleSortOption;
};

@Injectable()
export class WikipediaArticlesService {
  constructor(private readonly formulaRenderer: ArticleFormulaRenderer) {}

  normalizeLimit(limit: number): number {
    if (!Number.isFinite(limit) || limit <= 0) {
      return DEFAULT_ARTICLE_LIMIT;
    }

    return Math.min(Math.floor(limit), MAX_ARTICLE_LIMIT);
  }

  async discover(params: ArticleDiscoveryParams): Promise<WikipediaArticle[]> {
    return params.recommended && !params.search
      ? this.getRecommendedArticles(params)
      : this.getLiveArticles(params);
  }

  applyPresentation<T extends WikipediaArticle>(
    articles: T[],
    params: ArticlePresentationParams,
  ): T[] {
    return [...articles]
      .filter((article) => this.matchesReadyAdaptationFilter(article, params))
      .sort((left, right) => this.compareArticles(left, right, params))
      .slice(0, params.limit);
  }

  async getArticleDetail(
    pageId: number,
    languageCode = DEFAULT_LANGUAGE_CODE,
  ): Promise<WikipediaArticleDetail> {
    const queryParams = new URLSearchParams({
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
    const data = await this.fetchWikipediaResponse(queryParams, languageCode);
    const page = this.getPages(data).find(
      (currentPage) => currentPage.pageid === pageId,
    );

    if (!page?.title || !page.fullurl) {
      throw new BadGatewayException('Wikipedia article is unavailable.');
    }

    const html = await this.fetchWikipediaHtml(page.title, languageCode);
    const blocks = await this.formulaRenderer.render(parseHtmlToBlocks(html));
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
      thumbnailUrl: page.thumbnail?.source,
      title: page.title,
      url: page.fullurl,
    };
  }

  private async getLiveArticles(
    params: ArticleDiscoveryParams,
  ): Promise<WikipediaArticle[]> {
    const requestLimit = params.search
      ? Math.min(MAX_ARTICLE_LIMIT, params.limit * 8)
      : Math.min(MAX_ARTICLE_LIMIT, params.limit * 6);
    const primaryPages = await this.fetchLiveArticlePages({
      category: params.category,
      requestLimit,
      search: params.search,
    });
    const fallbackPages =
      params.search &&
      params.category !== 'all' &&
      primaryPages.length < params.limit
        ? await this.fetchLiveArticlePages({
            category: 'all',
            requestLimit,
            search: params.search,
          })
        : [];

    return this.mergeAndMapPages(
      [...primaryPages, ...fallbackPages],
      new Set(params.excludeIds),
      params.previewLength,
    ).slice(0, params.limit);
  }

  private async getRecommendedArticles(
    params: ArticleDiscoveryParams,
  ): Promise<WikipediaArticle[]> {
    const titles = selectRecommendedArticleTitles(
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
    const recommendedArticles = this.getPages(data)
      .filter((page) => !excludedIds.has(page.pageid))
      .filter((page) => this.isUsablePreview(page, params.previewLength))
      .sort(
        (left, right) =>
          (titleRank.get(this.normalizeTitle(left.title)) ??
            Number.MAX_SAFE_INTEGER) -
          (titleRank.get(this.normalizeTitle(right.title)) ??
            Number.MAX_SAFE_INTEGER),
      )
      .map((page) => this.mapPage(page));

    if (recommendedArticles.length >= params.limit) {
      return recommendedArticles.slice(0, params.limit);
    }

    const fallbackArticles = await this.getLiveArticles({
      ...params,
      excludeIds: [
        ...params.excludeIds,
        ...recommendedArticles.map((article) => article.id),
      ],
      limit: params.limit - recommendedArticles.length,
      recommended: false,
    });

    return [...recommendedArticles, ...fallbackArticles].slice(0, params.limit);
  }

  private async fetchLiveArticlePages(params: {
    category: WikipediaArticleCategory;
    requestLimit: number;
    search?: string;
  }): Promise<WikipediaPage[]> {
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

    if (params.search) {
      queryParams.set('generator', 'search');
      queryParams.set(
        'gsrsearch',
        getCategorySearchQuery(params.search, params.category),
      );
      queryParams.set('gsrlimit', String(params.requestLimit));
      queryParams.set('gsrnamespace', '0');
    } else if (params.category !== 'all') {
      queryParams.set('generator', 'search');
      queryParams.set(
        'gsrsearch',
        getCategorySearchQuery(
          getCategoryDiscoveryTerm(params.category),
          params.category,
        ),
      );
      queryParams.set('gsrlimit', String(params.requestLimit));
      queryParams.set('gsrnamespace', '0');
    } else {
      queryParams.set('generator', 'random');
      queryParams.set('grnlimit', String(params.requestLimit));
      queryParams.set('grnnamespace', '0');
    }

    return this.getPages(await this.fetchWikipediaResponse(queryParams));
  }

  private mergeAndMapPages(
    pages: WikipediaPage[],
    excludedIds: Set<number>,
    previewLength: WikipediaArticlePreviewLength,
  ): WikipediaArticle[] {
    const articleById = new Map<number, WikipediaArticle>();

    for (const page of pages) {
      if (
        excludedIds.has(page.pageid) ||
        articleById.has(page.pageid) ||
        !this.isUsablePreview(page, previewLength)
      ) {
        continue;
      }

      articleById.set(page.pageid, this.mapPage(page));
    }

    return Array.from(articleById.values());
  }

  private isUsablePreview(
    page: WikipediaPage,
    previewLength: WikipediaArticlePreviewLength,
  ): boolean {
    const title = sanitizeWikipediaText(page.title).trim();
    const extract = sanitizeWikipediaText(page.extract ?? '').trim();

    return Boolean(
      page.fullurl &&
      title &&
      extract &&
      !isExcludedWikipediaTitle(title) &&
      this.matchesPreviewLength(extract, previewLength),
    );
  }

  private matchesPreviewLength(
    extract: string,
    previewLength: WikipediaArticlePreviewLength,
  ): boolean {
    const length = extract.trim().length;

    if (previewLength === 'short') return length > 0 && length <= 120;
    if (previewLength === 'medium') return length >= 121 && length <= 220;
    if (previewLength === 'long') return length >= 221;
    return true;
  }

  private matchesReadyAdaptationFilter(
    article: WikipediaArticle,
    params: Pick<
      ArticlePresentationParams,
      'readyLevel' | 'readyTransformationType'
    >,
  ): boolean {
    if (
      params.readyLevel === 'all' &&
      params.readyTransformationType === 'all'
    ) {
      return true;
    }

    const adaptations = article.availableAdaptations ?? [];

    if (params.readyTransformationType === 'both') {
      const matchingLevel =
        params.readyLevel === 'all'
          ? adaptations
          : adaptations.filter(({ level }) => level === params.readyLevel);
      const types = new Set(
        matchingLevel.map(({ transformationType }) => transformationType),
      );
      return types.has('adaptation') && types.has('summary');
    }

    return adaptations.some(
      ({ level, transformationType }) =>
        (params.readyLevel === 'all' || level === params.readyLevel) &&
        (params.readyTransformationType === 'all' ||
          transformationType === params.readyTransformationType),
    );
  }

  private compareArticles(
    left: WikipediaArticle,
    right: WikipediaArticle,
    params: Pick<ArticlePresentationParams, 'preferImagesFirst' | 'sortBy'>,
  ): number {
    if (params.preferImagesFirst) {
      const difference =
        Number(Boolean(right.thumbnailUrl)) -
        Number(Boolean(left.thumbnailUrl));
      if (difference !== 0) return difference;
    }

    if (params.sortBy === 'length_desc') {
      return (right.pageLength ?? 0) - (left.pageLength ?? 0);
    }
    if (params.sortBy === 'length_asc') {
      return (left.pageLength ?? 0) - (right.pageLength ?? 0);
    }
    return 0;
  }

  private getPages(data: WikipediaApiResponse): WikipediaPage[] {
    return Object.values(data.query?.pages ?? {});
  }

  private mapPage(page: WikipediaPage): WikipediaArticle {
    return {
      extract: sanitizeWikipediaText(page.extract ?? ''),
      id: page.pageid,
      pageLength: page.length,
      thumbnailUrl: page.thumbnail?.source,
      title: sanitizeWikipediaText(page.title),
      url: page.fullurl ?? '',
    };
  }

  private normalizeTitle(title: string): string {
    return title.replaceAll('_', ' ').trim().toLowerCase();
  }

  private async fetchWikipediaResponse(
    params: URLSearchParams,
    languageCode = DEFAULT_LANGUAGE_CODE,
  ): Promise<WikipediaApiResponse> {
    const response = await fetch(
      `https://${languageCode}.wikipedia.org/w/api.php?${params.toString()}`,
      { headers: this.createHeaders() },
    );

    if (!response.ok) {
      throw new BadGatewayException('Failed to fetch Wikipedia content.');
    }

    return response.json() as Promise<WikipediaApiResponse>;
  }

  private async fetchWikipediaHtml(
    pageTitle: string,
    languageCode: string,
  ): Promise<string> {
    const response = await fetch(
      `https://${languageCode}.wikipedia.org/w/rest.php/v1/page/${encodeURIComponent(
        pageTitle.replaceAll(' ', '_'),
      )}/html`,
      {
        headers: {
          ...this.createHeaders(),
          Accept: 'text/html; charset=utf-8',
        },
      },
    );

    if (!response.ok) {
      throw new BadGatewayException('Failed to fetch Wikipedia article HTML.');
    }

    return response.text();
  }

  private createHeaders(): Record<string, string> {
    return {
      'Api-User-Agent': WIKIMEDIA_USER_AGENT,
      'User-Agent': WIKIMEDIA_USER_AGENT,
    };
  }
}
