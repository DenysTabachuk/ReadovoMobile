import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import Groq from 'groq-sdk';

import { DatabaseService } from '../database/database.service';
import {
  type ArticleSimplificationLevel,
  type ArticleSimplificationTargetLength,
  type SimplifiedArticleCacheRow,
  type SimplifyArticleResponse,
  type WikipediaApiResponse,
  type WikipediaArticle,
  type WikipediaArticleDetail,
  type WikipediaPage,
} from './types';

const DEFAULT_ARTICLE_LIMIT = 20;
const DEFAULT_SIMPLIFICATION_LEVEL: ArticleSimplificationLevel = 'A2';
const DEFAULT_TARGET_LENGTH: ArticleSimplificationTargetLength = 'short';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const MAX_ARTICLE_LIMIT = 50;
const WIKIMEDIA_USER_AGENT = 'SpeaklyMobile/1.0';
const WIKIPEDIA_LANGUAGE_CODE = 'en';

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getRandomArticles(
    limit = DEFAULT_ARTICLE_LIMIT,
  ): Promise<WikipediaArticle[]> {
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

  async simplifyArticle(params: {
    level?: ArticleSimplificationLevel;
    targetLength?: ArticleSimplificationTargetLength;
    text: string;
    title?: string;
  }): Promise<SimplifyArticleResponse> {
    const title = params.title?.trim() || 'Untitled article';
    const text = params.text.trim();
    const level = params.level ?? DEFAULT_SIMPLIFICATION_LEVEL;
    const targetLength = params.targetLength ?? DEFAULT_TARGET_LENGTH;
    const originalLength = text.length;
    const cacheKey = this.createSimplificationCacheKey({
      level,
      targetLength,
      text,
      title,
    });
    const cachedResponse = await this.getCachedSimplification(cacheKey);

    if (cachedResponse) {
      this.logger.log(
        `Simplification cache hit: title="${title}", level=${level}, targetLength=${targetLength}`,
      );
      return cachedResponse;
    }

    this.logger.log(
      `Simplification cache miss: title="${title}", level=${level}, targetLength=${targetLength}, originalLength=${originalLength}`,
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

    const prompt = this.createSimplificationPrompt({
      level,
      targetLength,
      text,
      title,
    });

    try {
      this.logger.log(
        `Sending simplification request to Groq: model=${GROQ_MODEL}, title="${title}"`,
      );

      // Groq runs only on the backend so the API key never reaches the app.
      const client = new Groq({ apiKey });
      const completion = await client.chat.completions.create({
        max_completion_tokens: 1024,
        messages: [
          {
            content:
              'You are helping to create educational English texts for language learners.',
            role: 'system',
          },
          {
            content: prompt,
            role: 'user',
          },
        ],
        model: GROQ_MODEL,
        temperature: 0.3,
      });
      const adaptedText = completion.choices[0]?.message?.content?.trim() ?? '';

      if (!adaptedText) {
        this.logger.error(
          `Groq returned empty simplification text: title="${title}"`,
        );
        throw new BadGatewayException('Article simplification is unavailable.');
      }

      const response: SimplifyArticleResponse = {
        adaptedLength: adaptedText.length,
        adaptedText,
        level,
        originalLength,
        targetLength,
        title,
      };

      await this.storeSimplification(cacheKey, response);
      this.logger.log(
        `Simplification stored: title="${title}", adaptedLength=${response.adaptedLength}`,
      );

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

  private createSimplificationPrompt(params: {
    level: ArticleSimplificationLevel;
    targetLength: ArticleSimplificationTargetLength;
    text: string;
    title: string;
  }): string {
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
- Avoid complex academic words where possible.
- If a difficult word is important, keep it but explain it simply.
- Make the text coherent, not just a list of sentences.
- Target length: ${params.targetLength}.
- For "short", return about 8-12 sentences.
- For "medium", return about 12-18 sentences.
- Return only the adapted English text without explanations.

Title:
${params.title}

Original text:
${params.text}`;
  }

  private createSimplificationCacheKey(params: {
    level: ArticleSimplificationLevel;
    targetLength: ArticleSimplificationTargetLength;
    text: string;
    title: string;
  }): string {
    const digest = createHash('sha256')
      .update(
        `${params.title}::${params.level}::${params.targetLength}::${params.text}`,
      )
      .digest('hex');

    return `${params.level}::${params.targetLength}::${digest}`;
  }

  private async getCachedSimplification(
    cacheKey: string,
  ): Promise<SimplifyArticleResponse | null> {
    const result = await this.databaseService.query<SimplifiedArticleCacheRow>(
      `
        SELECT
          title,
          level,
          target_length,
          original_length,
          adapted_text,
          adapted_length
        FROM article_simplifications
        WHERE cache_key = $1
      `,
      [cacheKey],
    );
    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      adaptedLength: row.adapted_length,
      adaptedText: row.adapted_text,
      level: row.level as ArticleSimplificationLevel,
      originalLength: row.original_length,
      targetLength: row.target_length as ArticleSimplificationTargetLength,
      title: row.title,
    };
  }

  private async storeSimplification(
    cacheKey: string,
    response: SimplifyArticleResponse,
  ): Promise<void> {
    await this.databaseService.query(
      `
        INSERT INTO article_simplifications (
          cache_key,
          title,
          level,
          target_length,
          original_length,
          adapted_text,
          adapted_length
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (cache_key) DO UPDATE
        SET
          title = EXCLUDED.title,
          level = EXCLUDED.level,
          target_length = EXCLUDED.target_length,
          original_length = EXCLUDED.original_length,
          adapted_text = EXCLUDED.adapted_text,
          adapted_length = EXCLUDED.adapted_length
      `,
      [
        cacheKey,
        response.title,
        response.level,
        response.targetLength,
        response.originalLength,
        response.adaptedText,
        response.adaptedLength,
      ],
    );
  }
}
