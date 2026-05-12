import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import {
  type GoogleTranslateResponse,
  type TranslateWordResponse,
} from './types';

const DEFAULT_SOURCE_LANGUAGE = 'en';
const DEFAULT_TARGET_LANGUAGE = 'uk';
const GOOGLE_TRANSLATE_API_URL =
  'https://translation.googleapis.com/language/translate/v2';
const CONTEXT_WORD_START_MARKER = '__CTX_WORD_START__';
const CONTEXT_WORD_END_MARKER = '__CTX_WORD_END__';

@Injectable()
export class TranslationsService {
  // MVP: in-memory cache keeps repeated word lookups off the Google API.
  // This should move to persistent storage once dictionary/progress data exists.
  private readonly baseWordCache = new Map<string, string>();

  async translateWord(params: {
    context?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    word: string;
  }): Promise<TranslateWordResponse> {
    const sourceLanguage = params.sourceLanguage ?? DEFAULT_SOURCE_LANGUAGE;
    const targetLanguage = params.targetLanguage ?? DEFAULT_TARGET_LANGUAGE;
    const baseCacheKey = this.createBaseCacheKey(
      params.word,
      sourceLanguage,
      targetLanguage,
    );
    const cachedBaseTranslation = this.baseWordCache.get(baseCacheKey);
    let baseTranslation = cachedBaseTranslation;

    // Context-aware path:
    // 1) Wrap the selected word with stable text markers inside the original sentence.
    // 2) Translate the full sentence once via Google Translate.
    // 3) Extract the translated fragment between markers as `translation`.
    // This gives a word translation shaped by sentence context (gender/case/sense),
    // while `contextTranslation` is the same translated sentence without markers.
    const contextWithMarker = params.context
      ? this.wrapContextWord(params.context, params.word)
      : null;
    let contextualTranslation: string | undefined;
    let contextTranslation: string | undefined;

    if (contextWithMarker) {
      const translatedContextWithMarker = await this.translateText({
        sourceLanguage,
        targetLanguage,
        text: contextWithMarker,
      });
      const extractedTranslation = this.extractTaggedContent(
        translatedContextWithMarker,
      );

      if (extractedTranslation) {
        contextualTranslation = extractedTranslation;
        contextTranslation = this.stripContextWordTags(translatedContextWithMarker);
      } else {
        contextTranslation = await this.translateText({
          sourceLanguage,
          targetLanguage,
          text: params.context ?? '',
        });
      }
    }

    if (!baseTranslation) {
      baseTranslation = await this.translateText({
        sourceLanguage,
        targetLanguage,
        text: params.word,
      });
      this.baseWordCache.set(baseCacheKey, baseTranslation);
    }

    const translation = contextualTranslation ?? baseTranslation;

    return {
      baseTranslation,
      context: params.context,
      contextTranslation,
      contextualTranslation,
      sourceLanguage,
      targetLanguage,
      translation,
      word: params.word,
    };
  }

  private async translateText(params: {
    format?: 'text';
    sourceLanguage: string;
    targetLanguage: string;
    text: string;
  }): Promise<string> {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Translation service is not configured.',
      );
    }

    const url = new URL(GOOGLE_TRANSLATE_API_URL);

    url.searchParams.set('format', params.format ?? 'text');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('model', 'nmt');
    url.searchParams.set('q', params.text);
    url.searchParams.set('source', params.sourceLanguage);
    url.searchParams.set('target', params.targetLanguage);

    const response = await fetch(url, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new BadGatewayException('Failed to fetch translation.');
    }

    const data = (await response.json()) as GoogleTranslateResponse;
    const translatedText = data.data?.translations?.[0]?.translatedText?.trim();

    if (!translatedText) {
      throw new BadGatewayException('Translation is unavailable.');
    }

    return this.decodeHtmlEntities(translatedText);
  }

  private createBaseCacheKey(
    word: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): string {
    return `${word.toLowerCase()}::${sourceLanguage}::${targetLanguage}`;
  }

  private wrapContextWord(context: string, word: string): string | null {
    // We mark only the first exact substring match to keep behavior deterministic.
    const contextLower = context.toLowerCase();
    const wordLower = word.toLowerCase();
    const wordStart = contextLower.indexOf(wordLower);

    if (wordStart < 0) {
      return null;
    }

    const wordEnd = wordStart + word.length;
    const originalWordSlice = context.slice(wordStart, wordEnd);

    return `${context.slice(0, wordStart)}${CONTEXT_WORD_START_MARKER}${originalWordSlice}${CONTEXT_WORD_END_MARKER}${context.slice(wordEnd)}`;
  }

  private extractTaggedContent(translatedContextWithMarker: string): string | null {
    const contentMatch = translatedContextWithMarker.match(
      new RegExp(
        `${CONTEXT_WORD_START_MARKER}([\\s\\S]*?)${CONTEXT_WORD_END_MARKER}`,
        'i',
      ),
    );
    const taggedContent = contentMatch?.[1]?.trim();

    if (!taggedContent) {
      return null;
    }

    return this.decodeHtmlEntities(taggedContent);
  }

  private stripContextWordTags(translatedContextWithMarker: string): string {
    return this.decodeHtmlEntities(
      translatedContextWithMarker
        .replaceAll(CONTEXT_WORD_START_MARKER, '')
        .replaceAll(CONTEXT_WORD_END_MARKER, '')
        .trim(),
    );
  }

  private decodeHtmlEntities(value: string): string {
    return value
      .replaceAll('&#39;', "'")
      .replaceAll('&quot;', '"')
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>');
  }
}
