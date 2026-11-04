import { HttpService } from '@nestjs/axios';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { type Server } from 'node:http';
import request, { type Response } from 'supertest';
import Ajv, { type ValidateFunction } from 'ajv';

import { configureApiBoundaries } from '../common/configure-api-boundaries';
import { exportOpenApi } from '../openapi/export-openapi';
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
  const responseValidators = new Map<string, ValidateFunction<unknown>>();

  beforeAll(async () => {
    const document = await exportOpenApi();
    // OpenAPI annotations are allowed; validate only the referenced body schemas.
    const validator = new Ajv({ strict: false, allErrors: true });
    validator.addSchema(document, 'pilot');
    const responses = document.paths[path]?.post?.responses ?? {};
    for (const status of Object.keys(responses)) {
      responseValidators.set(
        status,
        validator.compile<unknown>({
          $ref: `pilot#/paths/~1api~1translations~1word/post/responses/${status}/content/application~1json/schema`,
        }),
      );
    }
  });

  function expectDocumentedResponse(response: Response): void {
    const validate =
      responseValidators.get(String(response.status)) ??
      responseValidators.get('default');
    if (!validate)
      throw new Error(`No documented response for ${response.status}`);
    const body: unknown = response.body;
    if (!validate(body)) {
      throw new Error(
        `HTTP body violates OpenAPI: ${JSON.stringify(validate.errors)}`,
      );
    }
  }

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
      .expect(expectDocumentedResponse)
      .send({ word: ' book ' })
      .expect(201, expected);
    await request(server)
      .post(path)
      .expect(expectDocumentedResponse)
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
    await request(server)
      .post(path)
      .expect(expectDocumentedResponse)
      .send({ word: 'book' })
      .expect(502, {
        statusCode: 502,
        code: 'TRANSLATIONS_REQUEST_FAILED',
        message: 'Failed to fetch translation.',
      });
  });

  it('preserves null context while omitting undefined translation fields', async () => {
    await request(server)
      .post(path)
      .expect(expectDocumentedResponse)
      .send({ word: 'book', context: null })
      .expect(201, {
        baseTranslation: 'book & page',
        context: null,
        sourceLanguage: 'en',
        targetLanguage: 'uk',
        translation: 'book & page',
        word: 'book',
      });
  });

  it('trims context and lowercases languages before validation', async () => {
    await request(server)
      .post(path)
      .expect(expectDocumentedResponse)
      .send({
        word: ' book ',
        context: ' sentence ',
        sourceLanguage: ' EN ',
        targetLanguage: ' UK ',
      })
      .expect(201, {
        baseTranslation: 'book & page',
        context: 'sentence',
        sourceLanguage: 'en',
        targetLanguage: 'uk',
        translation: 'book & page',
        word: 'book',
      });
  });

  it('serializes contextual success fields as strings', async () => {
    adapter.mockImplementationOnce((config) =>
      Promise.resolve({
        config,
        data: {
          data: {
            translations: [
              { translatedText: '<span data-ctx-word="1">книга</span> тут' },
            ],
          },
        },
        headers: {},
        status: 200,
        statusText: 'OK',
      }),
    );
    await request(server)
      .post(path)
      .expect(expectDocumentedResponse)
      .send({ word: 'book', context: 'book here' })
      .expect(201, {
        baseTranslation: 'book & page',
        context: 'book here',
        contextTranslation: 'книга тут',
        contextualTranslation: 'книга',
        sourceLanguage: 'en',
        targetLanguage: 'uk',
        translation: 'книга',
        word: 'book',
      });
  });

  it('returns declared validation details for unknown properties', async () => {
    await request(server)
      .post(path)
      .expect(expectDocumentedResponse)
      .send({ word: 'book', extra: true })
      .expect(400, {
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed.',
        details: { fields: [{ path: [], rule: 'PROPERTY_NOT_ALLOWED' }] },
      });
    expect(adapter).not.toHaveBeenCalled();
  });

  it('uses the shared malformed JSON response', async () => {
    await request(server)
      .post(path)
      .expect(expectDocumentedResponse)
      .set('Content-Type', 'application/json')
      .send('{')
      .expect(400, {
        statusCode: 400,
        code: 'REQUEST_MALFORMED',
        message: 'Malformed request body.',
      });
    expect(adapter).not.toHaveBeenCalled();
  });

  it('uses the shared payload size response', async () => {
    const oversizedBody = JSON.stringify({ word: 'a'.repeat(2 * 1024 * 1024) });
    await request(server)
      .post(path)
      .expect(expectDocumentedResponse)
      .set('Content-Type', 'application/json')
      .send(oversizedBody)
      .expect(413, {
        statusCode: 413,
        code: 'REQUEST_TOO_LARGE',
        message: 'Request body is too large.',
      });
    expect(adapter).not.toHaveBeenCalled();
  });

  it('documents the variable-status parser rejection fallback', async () => {
    await request(server)
      .post(path)
      .expect(expectDocumentedResponse)
      .set('Content-Type', 'application/json; charset=unsupported')
      .send('{"word":"book"}')
      .expect(415, {
        statusCode: 415,
        code: 'REQUEST_REJECTED',
        message: 'Request rejected.',
      });
    expect(adapter).not.toHaveBeenCalled();
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
    await request(server)
      .post(path)
      .expect(expectDocumentedResponse)
      .send({ word: 'book' })
      .expect(502, {
        statusCode: 502,
        code: 'TRANSLATIONS_UNAVAILABLE',
        message: 'Translation is unavailable.',
      });
  });

  it('hides configuration failures and does not call the provider', async () => {
    delete process.env.GOOGLE_TRANSLATE_API_KEY;
    await request(server)
      .post(path)
      .expect(expectDocumentedResponse)
      .send({ word: 'book' })
      .expect(500, {
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
    await request(server)
      .post(path)
      .expect(expectDocumentedResponse)
      .send({ word: 'book' })
      .expect(500, {
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
    await request(server)
      .post(path)
      .expect(expectDocumentedResponse)
      .send({ word: 'book' })
      .expect(500, {
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
    { word: 'book', sourceLanguage: null },
    { word: 'book', targetLanguage: null },
    { word: 'book', sourceLanguage: 'uk', targetLanguage: 'en' },
    { word: 'book', sourceLanguage: 'en', targetLanguage: 'en' },
    { word: 'book', sourceLanguage: 'uk', targetLanguage: 'uk' },
    { word: 'book', sourceLanguage: 'de', targetLanguage: 'uk' },
    { word: 'book', sourceLanguage: 'en', targetLanguage: 'qqqq' },
  ])(
    'validates request fields before contacting the provider %#',
    async (body) => {
      const response = await request(server)
        .post(path)
        .expect(expectDocumentedResponse)
        .send(body)
        .expect(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_FAILED',
      });
      expect(response.body).not.toHaveProperty('error');
      expect(adapter).not.toHaveBeenCalled();
    },
  );
});
