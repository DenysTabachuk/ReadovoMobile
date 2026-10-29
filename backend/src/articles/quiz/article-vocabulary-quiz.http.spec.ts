import { Logger } from '@nestjs/common';
import request from 'supertest';

import { type VocabularyQuizOutput } from '../contracts/ai-output.schemas';
import { AiResponseContractError } from '../infrastructure/ai.errors';
import {
  createArticleQuizHttpApp,
  type ArticleQuizHttpTestApp,
} from '../testing/create-article-quiz-http-app';

const path = '/api/articles/vocabulary-quiz';
const body = { text: 'The forest protects animals.' };
const validOutput: VocabularyQuizOutput = {
  resolvedLevel: 'A2',
  questions: [
    {
      id: 'vq1',
      prompt: 'Translate forest.',
      type: 'single_choice',
      format: 'translation',
      term: 'forest',
      termKind: 'word',
      translation: 'ліс',
      sourceExcerpt: null,
      explanation: null,
      options: [
        { id: 'correct', text: 'ліс' },
        { id: 'one', text: 'гора' },
        { id: 'two', text: 'море' },
        { id: 'three', text: 'місто' },
      ],
      correctOptionIds: ['correct'],
    },
  ],
};

describe('Article vocabulary quiz contract (HTTP)', () => {
  let testApp: ArticleQuizHttpTestApp<VocabularyQuizOutput>;
  let previousKey: string | undefined;
  beforeEach(async () => {
    previousKey = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = 'test-key';
    testApp = await createArticleQuizHttpApp<VocabularyQuizOutput>();
  });
  afterEach(async () => {
    await testApp.app.close();
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
    jest.restoreAllMocks();
  });

  it('keeps public generation and vocabulary metadata', async () => {
    testApp.provider.completeStructured.mockResolvedValueOnce(validOutput);
    const response = await request(testApp.server)
      .post(path)
      .send(body)
      .expect(201);
    expect(response.body).toMatchObject({
      resolvedLevel: 'A2',
      questions: [
        {
          id: 'vq1',
          term: 'forest',
          termKind: 'word',
          translation: 'ліс',
          type: 'single_choice',
          format: 'translation',
          correctOptionIds: ['vq1:correct'],
        },
      ],
    });
    expect(response.body).not.toHaveProperty('code');
  });

  it('retains the explicitly requested level over the provider level', async () => {
    testApp.provider.completeStructured.mockResolvedValueOnce(validOutput);
    const response = await request(testApp.server)
      .post(path)
      .send({ ...body, level: ' b1 ' })
      .expect(201);
    expect(response.body).toHaveProperty('resolvedLevel', 'B1');
  });

  it('keeps one semantic retry and accepts corrected vocabulary', async () => {
    testApp.provider.completeStructured
      .mockResolvedValueOnce({ resolvedLevel: 'A2', questions: [] })
      .mockResolvedValueOnce(validOutput);
    await request(testApp.server).post(path).send(body).expect(201);
    expect(testApp.provider.completeStructured).toHaveBeenCalledTimes(2);
  });

  it('returns a generic configuration failure', async () => {
    delete process.env.GROQ_API_KEY;
    await request(testApp.server).post(path).send(body).expect(500, {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    });
    expect(testApp.provider.completeStructured).not.toHaveBeenCalled();
  });

  it.each([
    new Error('PRIVATE_PROVIDER_DIAGNOSTICS'),
    new AiResponseContractError('PRIVATE_PROVIDER_DIAGNOSTICS'),
  ])(
    'maps provider-client failure %# without leaking diagnostics',
    async (error) => {
      const log = jest.spyOn(Logger.prototype, 'error');
      testApp.provider.completeStructured.mockRejectedValueOnce(error);
      await request(testApp.server).post(path).send(body).expect(502, {
        statusCode: 502,
        code: 'ARTICLES_VOCABULARY_QUIZ_GENERATION_FAILED',
        message: 'Failed to generate article vocabulary quiz.',
      });
      expect(log).toHaveBeenCalledWith(
        'Article vocabulary quiz generation failed.',
      );
      expect(JSON.stringify(log.mock.calls)).not.toContain(
        'PRIVATE_PROVIDER_DIAGNOSTICS',
      );
    },
  );

  it('returns the vocabulary code after semantic retry exhaustion', async () => {
    testApp.provider.completeStructured.mockResolvedValue({
      resolvedLevel: 'A2',
      questions: [],
    });
    await request(testApp.server).post(path).send(body).expect(502, {
      statusCode: 502,
      code: 'ARTICLES_VOCABULARY_QUIZ_GENERATION_FAILED',
      message: 'Failed to generate article vocabulary quiz.',
    });
    expect(testApp.provider.completeStructured).toHaveBeenCalledTimes(2);
  });

  it.each([{ text: ' ' }, { text: 42 }, { ...body, level: 'invalid' }])(
    'validates request %# before provider access',
    async (input) => {
      const response = await request(testApp.server)
        .post(path)
        .send(input)
        .expect(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_FAILED',
      });
      expect(testApp.provider.completeStructured).not.toHaveBeenCalled();
    },
  );
});
