import { Logger } from '@nestjs/common';
import request from 'supertest';

import { type ReadingQuizOutput } from '../contracts/ai-output.schemas';
import { AiResponseContractError } from '../infrastructure/ai.errors';
import {
  createArticleQuizHttpApp,
  type ArticleQuizHttpTestApp,
} from '../testing/create-article-quiz-http-app';

const path = '/api/articles/quiz';
const validOutput: ReadingQuizOutput = {
  questions: [
    {
      id: 'q1',
      prompt: 'Space is vast.',
      type: 'true_false',
      explanation: null,
      options: [
        { id: 'true', text: 'True' },
        { id: 'false', text: 'False' },
      ],
      correctOptionIds: ['true'],
    },
  ],
};

describe('Article reading quiz contract (HTTP)', () => {
  let testApp: ArticleQuizHttpTestApp<ReadingQuizOutput>;
  let previousKey: string | undefined;
  beforeEach(async () => {
    previousKey = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = 'test-key';
    testApp = await createArticleQuizHttpApp<ReadingQuizOutput>();
  });
  afterEach(async () => {
    await testApp.app.close();
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
    jest.restoreAllMocks();
  });

  it('keeps public generation and the questions wrapper', async () => {
    testApp.provider.completeStructured.mockResolvedValueOnce(validOutput);
    const response = await request(testApp.server)
      .post(path)
      .send({ text: ' Space is vast. ' })
      .expect(201);
    expect(response.body).toEqual({
      questions: [
        {
          id: 'q1',
          prompt: 'Space is vast.',
          type: 'true_false',
          options: [
            { id: 'true', text: 'True' },
            { id: 'false', text: 'False' },
          ],
          correctOptionIds: ['true'],
        },
      ],
    });
    expect(testApp.provider.completeStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'reading_quiz',
      }),
    );
  });

  it('keeps one semantic retry and can return the corrected quiz', async () => {
    testApp.provider.completeStructured
      .mockResolvedValueOnce({ questions: [] })
      .mockResolvedValueOnce(validOutput);
    await request(testApp.server)
      .post(path)
      .send({ text: 'Space is vast.' })
      .expect(201);
    expect(testApp.provider.completeStructured).toHaveBeenCalledTimes(2);
  });

  it('returns a generic configuration failure', async () => {
    delete process.env.GROQ_API_KEY;
    await request(testApp.server)
      .post(path)
      .send({ text: 'Space is vast.' })
      .expect(500, {
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
      await request(testApp.server)
        .post(path)
        .send({ text: 'Space is vast.' })
        .expect(502, {
          statusCode: 502,
          code: 'ARTICLES_QUIZ_GENERATION_FAILED',
          message: 'Failed to generate article quiz.',
        });
      expect(log).toHaveBeenCalledWith('Article quiz generation failed.');
      expect(JSON.stringify(log.mock.calls)).not.toContain(
        'PRIVATE_PROVIDER_DIAGNOSTICS',
      );
    },
  );

  it('returns the reading quiz code after semantic retry exhaustion', async () => {
    testApp.provider.completeStructured.mockResolvedValue({ questions: [] });
    await request(testApp.server)
      .post(path)
      .send({ text: 'Space is vast.' })
      .expect(502, {
        statusCode: 502,
        code: 'ARTICLES_QUIZ_GENERATION_FAILED',
        message: 'Failed to generate article quiz.',
      });
    expect(testApp.provider.completeStructured).toHaveBeenCalledTimes(2);
  });

  it.each([
    { text: ' ' },
    { text: 'Space', level: 'invalid' },
    { text: 'Space', targetLength: 'invalid' },
  ])('validates request %# before provider access', async (body) => {
    const response = await request(testApp.server)
      .post(path)
      .send(body)
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
    });
    expect(testApp.provider.completeStructured).not.toHaveBeenCalled();
  });
});
