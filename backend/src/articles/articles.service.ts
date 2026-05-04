import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
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
  type ArticleSimplificationLevel,
  type ArticleSimplificationTargetLength,
  type FormulaBlock,
  type GetWikipediaArticlesParams,
  type SimplifiedArticleCacheRow,
  type SimplifyArticleResponse,
  type WikipediaApiResponse,
  type WikipediaArticle,
  type WikipediaArticleCategory,
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
const WIKIPEDIA_CATEGORY_TITLES: Record<
  Exclude<WikipediaArticleCategory, 'all'>,
  string
> = {
  culture: 'Culture',
  history: 'History',
  nature: 'Nature',
  science: 'Science',
  technology: 'Technology',
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
    const search = articleParams.search?.trim();
    const queryParams = new URLSearchParams({
      action: 'query',
      exintro: '1',
      explaintext: '1',
      exsentences: '2',
      format: 'json',
      inprop: 'url',
      origin: '*',
      piprop: 'thumbnail',
      pithumbsize: '320',
      prop: 'extracts|pageimages|info',
      redirects: '1',
    });

    if (search) {
      queryParams.set('generator', 'search');
      queryParams.set('gsrsearch', this.buildSearchQuery(search, category));
      queryParams.set('gsrlimit', String(normalizedLimit));
      queryParams.set('gsrnamespace', '0');
    } else if (category !== 'all') {
      queryParams.set('generator', 'categorymembers');
      queryParams.set(
        'gcmtitle',
        `Category:${WIKIPEDIA_CATEGORY_TITLES[category]}`,
      );
      queryParams.set('gcmlimit', String(normalizedLimit));
      queryParams.set('gcmnamespace', '0');
      queryParams.set('gcmtype', 'page');
    } else {
      queryParams.set('generator', 'random');
      queryParams.set('grnlimit', String(normalizedLimit));
      queryParams.set('grnnamespace', '0');
    }

    const data = await this.fetchWikipediaResponse(queryParams);

    return this.getPagesFromResponse(data)
      .filter((page) => Boolean(page.extract && page.fullurl))
      .map((page) => this.mapPageToArticle(page));
  }

  async getRandomArticles(
    limit = DEFAULT_ARTICLE_LIMIT,
  ): Promise<WikipediaArticle[]> {
    return this.getArticles({ limit });
  }

  async getArticleDetail(pageId: number): Promise<WikipediaArticleDetail> {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      inprop: 'url',
      origin: '*',
      pageids: String(pageId),
      piprop: 'thumbnail',
      pithumbsize: '640',
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
        max_completion_tokens: 2048,
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
      const rawResponse = completion.choices[0]?.message?.content?.trim() ?? '';
      const parsedResponse = this.parseSimplificationModelResponse(rawResponse);
      const adaptedText = parsedResponse.adaptedText;

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
        ...(parsedResponse.adaptedBlocks
          ? { adaptedBlocks: parsedResponse.adaptedBlocks }
          : {}),
        ...(parsedResponse.questions && parsedResponse.questions.length > 0
          ? { questions: parsedResponse.questions }
          : {}),
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
      const completion = await client.chat.completions.create({
        max_completion_tokens: 1400,
        messages: [
          {
            content:
              'You are helping to create educational English quizzes for language learners.',
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
      const rawResponse = completion.choices[0]?.message?.content?.trim() ?? '';
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

  private createSimplificationPrompt(params: {
    level: ArticleSimplificationLevel;
    targetLength: ArticleSimplificationTargetLength;
    text: string;
    title: string;
  }): string {
    const questionRule = this.getQuestionCountRule(params.targetLength);

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
- Return a valid JSON object only, without markdown fences or extra text.
- JSON schema:
  {
    "adaptedText": string,
    "adaptedBlocks": ArticleBlock[]
  }
- "adaptedText" must be a plain-text version of the same adapted content.
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
- Never invent image URLs or table values that are not supported by the source text.
- Generate comprehension questions for the adapted text.
- Question count: ${questionRule}.
- Allowed question types:
  - "single_choice": exactly 1 correct option.
  - "multiple_choice": 2 or more correct options.
  - "true_false": exactly 2 options ("True", "False"), exactly 1 correct option.
- Questions must match learner level ${params.level}.
- Keep wording simple for A1/A2, moderate for B1, richer but clear for B2.
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

Original text:
${params.text}`;
  }

  private createQuizPrompt(params: {
    level: ArticleSimplificationLevel;
    targetLength: ArticleSimplificationTargetLength;
    text: string;
    title: string;
  }): string {
    const questionRule = this.getQuestionCountRule(params.targetLength);

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
- For B1 moderate complexity; for B2 richer but clear wording.
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

  private parseSimplificationModelResponse(rawResponse: string): {
    adaptedBlocks?: ArticleBlock[];
    adaptedText: string;
    questions?: ArticleQuizQuestion[];
  } {
    if (!rawResponse) {
      return { adaptedText: '' };
    }

    const normalized = rawResponse
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    try {
      const parsed = JSON.parse(normalized) as {
        adaptedBlocks?: unknown;
        adaptedText?: unknown;
        questions?: unknown;
      };
      const adaptedText =
        typeof parsed.adaptedText === 'string' ? parsed.adaptedText.trim() : '';
      const adaptedBlocks = Array.isArray(parsed.adaptedBlocks)
        ? (parsed.adaptedBlocks as ArticleBlock[])
        : undefined;
      const questions = this.normalizeQuestions(parsed.questions);

      if (adaptedText) {
        return {
          adaptedBlocks,
          adaptedText,
          questions: questions.length > 0 ? questions : undefined,
        };
      }
    } catch {
      // Fallback to plain-text response format from older prompts.
    }

    return { adaptedText: rawResponse.trim() };
  }

  private parseQuizModelResponse(rawResponse: string): ArticleQuizQuestion[] {
    if (!rawResponse) {
      return [];
    }

    const normalized = rawResponse
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    try {
      const parsed = JSON.parse(normalized) as { questions?: unknown };
      return this.normalizeQuestions(parsed.questions);
    } catch {
      return [];
    }
  }

  private getQuestionCountRule(
    targetLength: ArticleSimplificationTargetLength,
  ): string {
    if (targetLength === 'short') {
      return 'exactly 3 questions';
    }

    if (targetLength === 'medium') {
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
