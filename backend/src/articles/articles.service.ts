import { BadGatewayException, Injectable } from '@nestjs/common';

import {
  type WikipediaApiResponse,
  type WikipediaArticle,
  type WikipediaArticleDetail,
  type WikipediaPage,
} from './types';

const DEFAULT_ARTICLE_LIMIT = 20;
const MAX_ARTICLE_LIMIT = 50;
const WIKIMEDIA_USER_AGENT = 'SpeaklyMobile/1.0';
const WIKIPEDIA_LANGUAGE_CODE = 'en';

@Injectable()
export class ArticlesService {
  async getRandomArticles(limit = DEFAULT_ARTICLE_LIMIT): Promise<WikipediaArticle[]> {
    const params = new URLSearchParams({
      action: 'query',
      exintro: '1',
      explaintext: '1',
      exsentences: '2',
      format: 'json',
      generator: 'random',
      grnlimit: String(this.normalizeLimit(limit)),
      grnnamespace: '0',
      inprop: 'url',
      origin: '*',
      piprop: 'thumbnail',
      pithumbsize: '320',
      prop: 'extracts|pageimages|info',
      redirects: '1',
    });
    const data = await this.fetchWikipediaResponse(params);

    return this.getPagesFromResponse(data)
      .filter((page) => Boolean(page.extract && page.fullurl))
      .map((page) => this.mapPageToArticle(page));
  }

  async getArticleDetail(pageId: number): Promise<WikipediaArticleDetail> {
    const params = new URLSearchParams({
      action: 'query',
      explaintext: '1',
      format: 'json',
      inprop: 'url',
      origin: '*',
      pageids: String(pageId),
      piprop: 'thumbnail',
      pithumbsize: '640',
      prop: 'extracts|pageimages|info',
      redirects: '1',
    });
    const data = await this.fetchWikipediaResponse(params);
    const page = this.getPagesFromResponse(data).find(
      (currentPage) => currentPage.pageid === pageId,
    );

    if (!page?.extract || !page.fullurl) {
      throw new BadGatewayException('Wikipedia article is unavailable.');
    }

    return {
      content: page.extract,
      id: page.pageid,
      title: page.title,
      url: page.fullurl,
      thumbnailUrl: page.thumbnail?.source,
    };
  }

  private normalizeLimit(limit: number): number {
    if (!Number.isFinite(limit) || limit <= 0) {
      return DEFAULT_ARTICLE_LIMIT;
    }

    return Math.min(Math.floor(limit), MAX_ARTICLE_LIMIT);
  }

  private createWikipediaRequestUrl(params: URLSearchParams): string {
    return `https://${WIKIPEDIA_LANGUAGE_CODE}.wikipedia.org/w/api.php?${params.toString()}`;
  }

  private getPagesFromResponse(data: WikipediaApiResponse): WikipediaPage[] {
    return Object.values(data.query?.pages ?? {});
  }

  private mapPageToArticle(page: WikipediaPage): WikipediaArticle {
    return {
      id: page.pageid,
      title: page.title,
      extract: page.extract ?? '',
      url: page.fullurl ?? '',
      thumbnailUrl: page.thumbnail?.source,
    };
  }

  private async fetchWikipediaResponse(
    params: URLSearchParams,
  ): Promise<WikipediaApiResponse> {
    const response = await fetch(this.createWikipediaRequestUrl(params), {
      headers: {
        'Api-User-Agent': WIKIMEDIA_USER_AGENT,
        'User-Agent': WIKIMEDIA_USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new BadGatewayException('Failed to fetch Wikipedia content.');
    }

    return response.json() as Promise<WikipediaApiResponse>;
  }
}
