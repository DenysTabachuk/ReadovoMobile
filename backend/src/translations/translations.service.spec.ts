import {
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';

import { TranslationsService } from './translations.service';

describe('TranslationsService', () => {
  let service: TranslationsService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    service = new TranslationsService();
    fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;
    process.env.GOOGLE_TRANSLATE_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.GOOGLE_TRANSLATE_API_KEY;
  });

  it('translates a word and returns the provided context', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        data: {
          translations: [
            {
              translatedText: 'правильний',
            },
          ],
        },
      }),
      ok: true,
    });

    const response = await service.translateWord({
      context: 'You are right.',
      sourceLanguage: 'en',
      targetLanguage: 'uk',
      word: 'right',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(response).toEqual({
      context: 'You are right.',
      sourceLanguage: 'en',
      targetLanguage: 'uk',
      translation: 'правильний',
      word: 'right',
    });
  });

  it('returns a cached translation without calling Google twice', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        data: {
          translations: [
            {
              translatedText: 'книга',
            },
          ],
        },
      }),
      ok: true,
    });

    await service.translateWord({
      sourceLanguage: 'en',
      targetLanguage: 'uk',
      word: 'book',
    });
    const cached = await service.translateWord({
      sourceLanguage: 'en',
      targetLanguage: 'uk',
      word: 'book',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cached.translation).toBe('книга');
  });

  it('throws when API key is not configured', async () => {
    delete process.env.GOOGLE_TRANSLATE_API_KEY;

    await expect(
      service.translateWord({
        sourceLanguage: 'en',
        targetLanguage: 'uk',
        word: 'book',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('throws when Google returns an unsuccessful response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
    });

    await expect(
      service.translateWord({
        sourceLanguage: 'en',
        targetLanguage: 'uk',
        word: 'book',
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
