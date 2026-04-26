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

@Injectable()
export class TranslationsService {
  // MVP: in-memory cache keeps repeated word lookups off the Google API.
  // This should move to persistent storage once dictionary/progress data exists.
  private readonly cache = new Map<string, string>();

  async translateWord(params: {
    context?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    word: string;
  }): Promise<TranslateWordResponse> {
    const sourceLanguage = params.sourceLanguage ?? DEFAULT_SOURCE_LANGUAGE;
    const targetLanguage = params.targetLanguage ?? DEFAULT_TARGET_LANGUAGE;
    const cacheKey = this.createCacheKey(
      params.word,
      sourceLanguage,
      targetLanguage,
    );
    const cachedTranslation = this.cache.get(cacheKey);

    if (cachedTranslation) {
      return {
        context: params.context,
        sourceLanguage,
        targetLanguage,
        translation: cachedTranslation,
        word: params.word,
      };
    }

    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Translation service is not configured.',
      );
    }

    const url = new URL(GOOGLE_TRANSLATE_API_URL);

    url.searchParams.set('format', 'text');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('model', 'nmt');
    url.searchParams.set('q', params.word);
    url.searchParams.set('source', sourceLanguage);
    url.searchParams.set('target', targetLanguage);

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

    const translation = this.decodeHtmlEntities(translatedText);

    // MVP: Cloud Translation Basic v2 does not expose a dedicated sentence
    // context field for disambiguating a single tapped word, so we translate
    // the word directly for now and keep the sentence for future upgrades.
    this.cache.set(cacheKey, translation);

    return {
      context: params.context,
      sourceLanguage,
      targetLanguage,
      translation,
      word: params.word,
    };
  }

  private createCacheKey(
    word: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): string {
    return `${word.toLowerCase()}::${sourceLanguage}::${targetLanguage}`;
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
