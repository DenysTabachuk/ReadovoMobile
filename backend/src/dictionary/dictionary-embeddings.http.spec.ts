import request from 'supertest';

import { DictionaryEmbeddingService } from './dictionary-embedding.service';
import {
  createDictionaryHttpApp,
  type DictionaryHttpTestApp,
} from './testing/create-dictionary-http-app';

type TestTensor = { array: () => Promise<number[][]>; dispose: () => void };
const mockEmbed = jest.fn<Promise<TestTensor>, [string[]]>();
const mockLoad = jest.fn<Promise<{ embed: typeof mockEmbed }>, []>();

// Keep the real embedding service and algorithms, replacing only TensorFlow/model I/O.
jest.mock('@tensorflow/tfjs', () => ({
  setBackend: jest.fn().mockResolvedValue(true),
  ready: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: () => mockLoad(),
}));

describe('Dictionary embeddings and distractors (HTTP)', () => {
  let testApp: DictionaryHttpTestApp;
  let dispose: jest.Mock<void, []>;

  beforeEach(async () => {
    mockEmbed.mockReset();
    mockLoad.mockReset();
    dispose = jest.fn<void, []>();
    mockEmbed.mockResolvedValue({
      array: () => Promise.resolve([[1, 0]]),
      dispose,
    });
    mockLoad.mockResolvedValue({ embed: mockEmbed });
    testApp = await createDictionaryHttpApp(new DictionaryEmbeddingService());
  });
  afterEach(async () => {
    await testApp.app.close();
  });

  it('returns and caches normalized embeddings with no error envelope', async () => {
    await request(testApp.server)
      .post('/api/dictionary/embedding')
      .send({ text: ' Target ' })
      .expect(201, [1, 0]);
    await request(testApp.server)
      .post('/api/dictionary/embedding')
      .send({ text: 'target' })
      .expect(201, [1, 0]);
    expect(mockEmbed).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalledWith(['target']);
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('rejects blank target text in the DTO before embedding', async () => {
    const response = await request(testApp.server)
      .post('/api/dictionary/embedding')
      .send({ text: '  ' })
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      details: { fields: [{ path: ['text'] }] },
    });
    expect(mockEmbed).not.toHaveBeenCalled();
  });

  it.each([
    { route: 'similar-words', body: { word: 'target', wordList: [' '] } },
    { route: 'quiz-options', body: { correctWord: 'target', wordList: [''] } },
  ])(
    'rejects blank candidates in the DTO on $route',
    async ({ route, body }) => {
      const response = await request(testApp.server)
        .post(`/api/dictionary/${route}`)
        .send(body)
        .expect(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        details: { fields: [{ path: ['wordList'], rule: 'FORMAT_INVALID' }] },
      });
      expect(mockEmbed).not.toHaveBeenCalled();
    },
  );

  it.each([
    { name: 'omitted', body: { word: 'target' } },
    { name: 'empty', body: { word: 'target', wordList: [] } },
    { name: 'optional null', body: { word: 'target', wordList: null } },
  ])(
    'preserves an empty similar-word result for an $name list',
    async ({ body }) => {
      await request(testApp.server)
        .post('/api/dictionary/similar-words')
        .send(body)
        .expect(201, []);
      expect(mockEmbed).not.toHaveBeenCalled();
    },
  );

  it('ranks normalized unique candidates and returns at most three', async () => {
    const vectors: Record<string, number[]> = {
      target: [1, 0],
      closest: [1, 0],
      nearby: [0.8, 0.2],
      distant: [0, 1],
      opposite: [-1, 0],
    };
    mockEmbed.mockImplementation(([text]) =>
      Promise.resolve({
        array: () => Promise.resolve([vectors[text]]),
        dispose,
      }),
    );
    await request(testApp.server)
      .post('/api/dictionary/similar-words')
      .send({
        word: 'TARGET',
        wordList: [
          'target',
          'CLOSEST',
          'closest',
          'nearby',
          'distant',
          'opposite',
        ],
      })
      .expect(201, ['closest', 'nearby', 'distant']);
    expect(mockEmbed).toHaveBeenCalledTimes(5);
  });

  it.each([
    { name: 'mismatched lengths', target: [1, 0], candidate: [1] },
    { name: 'empty vectors', target: [], candidate: [] },
  ])(
    'preserves the 400 embedding-dimension error for $name',
    async ({ target, candidate }) => {
      mockEmbed.mockImplementation(([text]) =>
        Promise.resolve({
          array: () =>
            Promise.resolve([text === 'target' ? target : candidate]),
          dispose,
        }),
      );
      await request(testApp.server)
        .post('/api/dictionary/similar-words')
        .send({ word: 'target', wordList: ['other'] })
        .expect(400, {
          statusCode: 400,
          code: 'DICTIONARY_EMBEDDINGS_INVALID',
          message: 'Embeddings must be non-empty arrays of the same length.',
        });
    },
  );

  it.each([
    { name: 'omitted', body: { correctWord: 'target' } },
    {
      name: 'fewer than three',
      body: { correctWord: 'target', wordList: ['one', 'two'] },
    },
  ])('rejects a distractor list with $name candidates', async ({ body }) => {
    await request(testApp.server)
      .post('/api/dictionary/quiz-options')
      .send(body)
      .expect(400, {
        statusCode: 400,
        code: 'DICTIONARY_QUIZ_DISTRACTORS_INSUFFICIENT',
        message: 'At least 3 distractor words are required.',
      });
  });

  it('keeps four quiz options as a success', async () => {
    const response = await request(testApp.server)
      .post('/api/dictionary/quiz-options')
      .send({ correctWord: 'TARGET', wordList: ['one', 'two', 'three'] })
      .expect(201);
    expect(response.body).toHaveLength(4);
    expect(response.body).toEqual(
      expect.arrayContaining(['target', 'one', 'two', 'three']),
    );
  });

  it('hides model request failures', async () => {
    mockEmbed.mockRejectedValue(new Error('secret-model-request'));
    await request(testApp.server)
      .post('/api/dictionary/embedding')
      .send({ text: 'target' })
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      });
  });
});
