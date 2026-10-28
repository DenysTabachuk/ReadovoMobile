import axios from 'axios';
import { HttpService } from '@nestjs/axios';

import { TranslationsService } from './translations.service';

describe('TranslationsService', () => {
  let service: TranslationsService;
  let requestMock: jest.Mock;

  beforeEach(() => {
    requestMock = jest.fn();
    service = new TranslationsService(
      new HttpService(Object.assign(requestMock, axios.create())),
    );

    process.env.GOOGLE_TRANSLATE_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.GOOGLE_TRANSLATE_API_KEY;
  });

  it('translates a word with contextual html marker extraction', async () => {
    requestMock
      .mockResolvedValueOnce({
        data: {
          data: {
            translations: [
              {
                translatedText:
                  'Вона була <span data-ctx-word="1">математикинею</span> свого часу.',
              },
            ],
          },
        },
        status: 200,
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            translations: [
              {
                translatedText: 'математик',
              },
            ],
          },
        },
        status: 200,
      });

    const response = await service.translateWord({
      context: 'She was a mathematician of her time.',
      sourceLanguage: 'en',
      targetLanguage: 'uk',
      word: 'mathematician',
    });

    expect(requestMock).toHaveBeenCalledWith(
      expect.stringContaining('https://translation.googleapis.com/'),
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
    requestMock.mockResolvedValue({
      data: {
        data: {
          translations: [
            {
              translatedText: 'книга',
            },
          ],
        },
      },
      status: 200,
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

    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(cached.translation).toBe('книга');
  });

  it('falls back to base translation when contextual extraction stays in source language', async () => {
    requestMock
      .mockResolvedValueOnce({
        data: {
          data: {
            translations: [
              {
                translatedText:
                  'Інші терміни, що <span data-ctx-word="1">have</span> використовувалися як синоніми.',
              },
            ],
          },
        },
        status: 200,
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            translations: [
              {
                translatedText:
                  'Інші терміни, що мали використовуватися як синоніми.',
              },
            ],
          },
        },
        status: 200,
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            translations: [
              {
                translatedText: 'мати',
              },
            ],
          },
        },
        status: 200,
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
});
