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

  it('translates a word with contextual html marker extraction', async () => {
    fetchMock
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: {
              translations: [
                {
                  translatedText:
                    'Вона була <span data-ctx-word="1">математикинею</span> свого часу.',
                },
              ],
            },
          }),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: {
              translations: [
                {
                  translatedText: 'математик',
                },
              ],
            },
          }),
        ok: true,
      });

    const response = await service.translateWord({
      context: 'She was a mathematician of her time.',
      sourceLanguage: 'en',
      targetLanguage: 'uk',
      word: 'mathematician',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(response).toEqual({
      baseTranslation: 'математик',
      context: 'She was a mathematician of her time.',
      contextTranslation: 'Вона була математикинею свого часу.',
      contextualTranslation: 'математикинею',
      sourceLanguage: 'en',
      targetLanguage: 'uk',
      translation: 'математикинею',
      word: 'mathematician',
    });
  });

  it('returns a cached translation without calling Google twice', async () => {
    fetchMock.mockResolvedValue({
      json: () =>
        Promise.resolve({
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

  it('falls back to base translation when contextual extraction stays in source language', async () => {
    fetchMock
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: {
              translations: [
                {
                  translatedText:
                    'Інші терміни, що <span data-ctx-word="1">have</span> використовувалися як синоніми.',
                },
              ],
            },
        }),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: {
              translations: [
                {
                  translatedText:
                    'Інші терміни, що мали використовуватися як синоніми.',
                },
              ],
            },
          }),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: {
              translations: [
                {
                  translatedText: 'мати',
                },
              ],
            },
          }),
        ok: true,
      });

    const response = await service.translateWord({
      context: 'Other terms that have been used as synonyms.',
      sourceLanguage: 'en',
      targetLanguage: 'uk',
      word: 'have',
    });

    expect(response.translation).toBe('мати');
    expect(response.contextualTranslation).toBeUndefined();
    expect(response.contextTranslation).toBe(
      'Інші терміни, що мали використовуватися як синоніми.',
    );
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
