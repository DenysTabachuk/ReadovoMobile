import { HttpService } from '@nestjs/axios';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { type Server } from 'node:http';
import request from 'supertest';

import { configureApiBoundaries } from '../common/configure-api-boundaries';
import { TranslationsModule } from './translations.module';

const path = '/api/translations/word';

describe('Translation provider contract (HTTP)', () => {
  let app: INestApplication<Server>;
  let server: Server;
  let adapter: jest.Mock<
    Promise<AxiosResponse<unknown>>,
    [InternalAxiosRequestConfig]
  >;
  let previousApiKey: string | undefined;

  beforeEach(async () => {
    previousApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    process.env.GOOGLE_TRANSLATE_API_KEY = 'private-test-key';
    const module = await Test.createTestingModule({
      imports: [TranslationsModule],
    }).compile();
    adapter = jest.fn((config: InternalAxiosRequestConfig) =>
      Promise.resolve({
        config,
        data: {
          data: {
            translations: [
              {
                translatedText: ' book &amp; page ',
                detectedSourceLanguage: 'en',
              },
              null,
            ],
          },
        },
        headers: {},
        status: 200,
        statusText: 'OK',
      }),
    );
    // Replace only network I/O; keep production Axios parsing and interceptors.
    module.get(HttpService).axiosRef.defaults.adapter = adapter;
    app = module.createNestApplication<INestApplication<Server>>({
      bodyParser: false,
    });
    configureApiBoundaries(app);
    await app.init();
    server = app.getHttpServer();
  });

  afterEach(async () => {
    await app.close();
    if (previousApiKey === undefined)
      delete process.env.GOOGLE_TRANSLATE_API_KEY;
    else process.env.GOOGLE_TRANSLATE_API_KEY = previousApiKey;
  });

  it('keeps the public endpoint, defaults, decoding and cache behavior', async () => {
    const expected = {
      baseTranslation: 'book & page',
      sourceLanguage: 'en',
      targetLanguage: 'uk',
      translation: 'book & page',
      word: 'book',
    };
    await request(server)
      .post(path)
      .send({ word: ' book ' })
      .expect(201, expected);
    await request(server)
      .post(path)
      .send({ word: 'book' })
      .expect(201, expected);
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it('maps a provider HTTP rejection without exposing its payload or URL', async () => {
    adapter.mockImplementationOnce((config) =>
      Promise.reject(
        new AxiosError(
          'private provider message',
          'ERR_BAD_RESPONSE',
          config,
          undefined,
          {
            config,
            data: { error: 'private provider body' },
            headers: {},
            status: 403,
            statusText: 'Forbidden',
          },
        ),
      ),
    );
    await request(server).post(path).send({ word: 'book' }).expect(502, {
      statusCode: 502,
      code: 'TRANSLATIONS_REQUEST_FAILED',
      message: 'Failed to fetch translation.',
    });
  });

  it.each([
    null,
    '"private provider text"',
    {},
    { data: null },
    { data: { translations: {} } },
    { data: { translations: [] } },
    { data: { translations: [null] } },
    { data: { translations: [{ translatedText: 42 }] } },
    { data: { translations: [{ translatedText: '  ' }] } },
  ])('maps unusable provider data %# to a stable 502', async (data) => {
    adapter.mockImplementationOnce((config) =>
      Promise.resolve({
        config,
        data,
        headers: {},
        status: 200,
        statusText: 'OK',
      }),
    );
    await request(server).post(path).send({ word: 'book' }).expect(502, {
      statusCode: 502,
      code: 'TRANSLATIONS_UNAVAILABLE',
      message: 'Translation is unavailable.',
    });
  });

  it('hides configuration failures and does not call the provider', async () => {
    delete process.env.GOOGLE_TRANSLATE_API_KEY;
    await request(server).post(path).send({ word: 'book' }).expect(500, {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    });
    expect(adapter).not.toHaveBeenCalled();
  });

  it('preserves generic 500 for transport failures without an HTTP response', async () => {
    adapter.mockRejectedValueOnce(
      new AxiosError('private timeout details', 'ETIMEDOUT'),
    );
    await request(server).post(path).send({ word: 'book' }).expect(500, {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    });
  });

  it('preserves generic 500 when transport rejects malformed provider JSON', async () => {
    adapter.mockImplementationOnce((config) =>
      Promise.resolve({
        config,
        data: '<html>private provider page</html>',
        headers: {},
        status: 200,
        statusText: 'OK',
      }),
    );
    await request(server).post(path).send({ word: 'book' }).expect(500, {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    });
  });

  it.each([
    { word: ' ' },
    { word: 'a'.repeat(201) },
    { word: 'book', context: 42 },
    { word: 'book', context: 'a'.repeat(4001) },
    { word: 'book', sourceLanguage: 'en-US' },
    { word: 'book', targetLanguage: 42 },
  ])(
    'validates request fields before contacting the provider %#',
    async (body) => {
      const response = await request(server).post(path).send(body).expect(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_FAILED',
      });
      expect(response.body).not.toHaveProperty('error');
      expect(adapter).not.toHaveBeenCalled();
    },
  );
});
