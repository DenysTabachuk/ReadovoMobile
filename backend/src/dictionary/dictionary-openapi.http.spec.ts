import request from 'supertest';

import { exportOpenApi } from '../openapi/export-openapi';
import { createDictionaryResponseAssertion } from './testing/create-dictionary-response-assertion';
import {
  createDictionaryHttpApp,
  DICTIONARY_TEST_WORD_ID,
  type DictionaryHttpTestApp,
} from './testing/create-dictionary-http-app';

const protectedRoutes = [
  {
    method: 'get',
    path: '/api/dictionary/me/words',
    operationId: 'getDictionaryWords',
  },
  {
    method: 'post',
    path: '/api/dictionary/me/words',
    operationId: 'createDictionaryWord',
  },
  {
    method: 'delete',
    path: `/api/dictionary/me/words/${DICTIONARY_TEST_WORD_ID}`,
    operationId: 'deleteDictionaryWord',
  },
  {
    method: 'patch',
    path: `/api/dictionary/me/words/${DICTIONARY_TEST_WORD_ID}/progress`,
    operationId: 'updateDictionaryWordProgress',
  },
  {
    method: 'get',
    path: '/api/dictionary/me/test',
    operationId: 'getDictionaryTest',
  },
] as const;

// Tokens issued before this offset have passed the access-token expiry.
const EXPIRED_TOKEN_OFFSET_MS = 60 * 60 * 1000;

describe('Dictionary OpenAPI wire contract (HTTP)', () => {
  let testApp: DictionaryHttpTestApp;
  let assertResponse: Awaited<
    ReturnType<typeof createDictionaryResponseAssertion>
  >;

  beforeAll(async () => {
    assertResponse = await createDictionaryResponseAssertion();
  });
  beforeEach(async () => {
    testApp = await createDictionaryHttpApp();
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    await testApp.app.close();
  });

  describe.each(protectedRoutes)('$operationId authentication', (route) => {
    it.each([
      {
        name: 'missing',
        authorization: '',
        code: 'AUTH_AUTHENTICATION_REQUIRED',
      },
      {
        name: 'invalid',
        authorization: 'Bearer invalid',
        code: 'AUTH_ACCESS_TOKEN_INVALID',
      },
    ])(
      'rejects a $name token before persistence',
      async ({ authorization, code }) => {
        const response = await request(testApp.server)
          [route.method](route.path)
          .set('Authorization', authorization)
          .expect(401)
          .expect((response) => assertResponse(route.operationId, response));
        expect(response.body).toMatchObject({ statusCode: 401, code });
        expect(testApp.repository.findAll).not.toHaveBeenCalled();
        expect(testApp.repository.create).not.toHaveBeenCalled();
        expect(testApp.repository.findById).not.toHaveBeenCalled();
        expect(testApp.repository.deleteById).not.toHaveBeenCalled();
      },
    );

    it('rejects an expired token', async () => {
      jest
        .spyOn(Date, 'now')
        .mockReturnValue(Date.now() + EXPIRED_TOKEN_OFFSET_MS);
      const response = await request(testApp.server)
        [route.method](route.path)
        .set('Authorization', testApp.authorization)
        .expect(401)
        .expect((response) => assertResponse(route.operationId, response));
      expect(response.body).toMatchObject({
        statusCode: 401,
        code: 'AUTH_ACCESS_TOKEN_EXPIRED',
      });
    });
  });

  it('serializes absent review dates by omission and present dates as ISO strings', async () => {
    testApp.repository.findAll.mockResolvedValue([
      { ...testApp.word, lastReviewedAt: undefined },
      { ...testApp.word, lastReviewedAt: '2026-11-03T12:00:00.000Z' },
    ]);
    const response = await request(testApp.server)
      .get('/api/dictionary/me/words')
      .set('Authorization', testApp.authorization)
      .expect(200)
      .expect((response) => assertResponse('getDictionaryWords', response));
    expect(response.body).toEqual([
      testApp.word,
      { ...testApp.word, lastReviewedAt: '2026-11-03T12:00:00.000Z' },
    ]);
  });

  it('documents all eight operations, existing statuses and public embedding boundaries', async () => {
    const document = await exportOpenApi();
    let count = 0;
    for (const [path, item] of Object.entries(document.paths)) {
      if (!path.startsWith('/api/dictionary/')) continue;
      for (const method of ['get', 'post', 'patch', 'delete'] as const) {
        const operation = item?.[method];
        if (!operation) continue;
        count += 1;
        expect(operation.security).toEqual(
          path.includes('/me/') ? [{ bearer: [] }] : [],
        );
        expect(operation.responses).toHaveProperty(
          method === 'post' ? '201' : '200',
        );
        if (path.includes('/me/'))
          expect(operation.responses).toHaveProperty('401');
        else expect(operation.responses).not.toHaveProperty('401');
      }
    }
    expect(count).toBe(8);
    expect(document.paths['/api/dictionary/me/test']?.get?.parameters).toEqual([
      expect.objectContaining({
        in: 'query',
        name: 'limit',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 10, default: 10 },
      }),
    ]);
    expect(
      document.paths['/api/dictionary/me/words/{wordId}']?.delete?.parameters,
    ).toEqual([
      expect.objectContaining({
        in: 'path',
        name: 'wordId',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      }),
    ]);
    const schemas = document.components?.schemas;
    expect(schemas?.DictionaryWord).toMatchObject({
      properties: { lastReviewedAt: { type: 'string', format: 'date-time' } },
    });
    expect(schemas?.DictionaryWord).not.toHaveProperty(
      'properties.lastReviewedAt.nullable',
    );
    expect(schemas?.DictionaryWord).toHaveProperty(
      'required',
      expect.not.arrayContaining(['lastReviewedAt']),
    );
    expect(schemas?.UpdateDictionaryWordProgressRequest).toMatchObject({
      additionalProperties: false,
      properties: { progress: { enum: ['in_progress'] } },
    });
    for (const name of [
      'SimilarDictionaryWordsRequest',
      'DictionaryQuizOptionsRequest',
    ]) {
      expect(schemas?.[name]).toMatchObject({
        additionalProperties: false,
        properties: {
          wordList: {
            type: 'array',
            nullable: true,
            maxItems: 1000,
            items: { type: 'string', pattern: '\\S' },
          },
        },
      });
    }
  });
});
