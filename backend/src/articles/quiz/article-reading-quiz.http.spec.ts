import { Logger } from '@nestjs/common';
import request from 'supertest';
import { z } from 'zod';
import { QuizService } from '../../quiz/quiz.service';

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

  it('creates an authenticated session without exposing its answer key', async () => {
    testApp.provider.completeStructured.mockResolvedValueOnce(validOutput);
    const createSession = jest.spyOn(testApp.app.get(QuizService), 'create');
    const response = await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({ text: ' Space is vast. ', level: ' b1 ', targetLength: ' LONG ' })
      .expect(201);
    const { questions } = z
      .object({
        questions: z.array(
          z.object({
            options: z.array(
              z.object({ id: z.string().uuid(), text: z.string() }),
            ),
          }),
        ),
      })
      .parse(response.body);
    expect(response.body).toEqual({
      sessionId: '33333333-3333-4333-8333-333333333333',
      questions: [
        {
          id: 'q1',
          prompt: 'Space is vast.',
          type: 'true_false',
          options: questions[0].options,
        },
      ],
    });
    expect(testApp.provider.completeStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'reading_quiz',
      }),
    );
    const correctOption = questions[0].options.find(
      (option) => option.text === 'True',
    );
    expect(correctOption).toBeDefined();
    if (!correctOption) throw new Error('Expected the true option.');
    expect(createSession).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      expect.objectContaining({
        questions: [
          expect.objectContaining({ correctOptionIds: [correctOption.id] }),
        ],
      }),
    );
    expect(testApp.provider.completeStructured.mock.calls[0][0]).toHaveProperty(
      'prompt',
      expect.stringContaining('Learner level: B1'),
    );
    expect(testApp.provider.completeStructured.mock.calls[0][0]).toHaveProperty(
      'prompt',
      expect.stringContaining('Question count: at least 6 questions'),
    );
    expect(createSession).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      expect.objectContaining({
        kind: 'article',
        level: 'B1',
        targetLength: 'long',
      }),
    );
  });

  it('keeps one semantic retry and can return the corrected quiz', async () => {
    testApp.provider.completeStructured
      .mockResolvedValueOnce({ questions: [] })
      .mockResolvedValueOnce(validOutput);
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({ text: 'Space is vast.', level: 'A2', targetLength: 'short' })
      .expect(201);
    expect(testApp.provider.completeStructured).toHaveBeenCalledTimes(2);
  });

  it('returns a generic configuration failure', async () => {
    delete process.env.GROQ_API_KEY;
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({ text: 'Space is vast.', level: 'A2', targetLength: 'short' })
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
        .set('Authorization', testApp.authorization)
        .send({ text: 'Space is vast.', level: 'A2', targetLength: 'short' })
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
      .set('Authorization', testApp.authorization)
      .send({ text: 'Space is vast.', level: 'A2', targetLength: 'short' })
      .expect(502, {
        statusCode: 502,
        code: 'ARTICLES_QUIZ_GENERATION_FAILED',
        message: 'Failed to generate article quiz.',
      });
    expect(testApp.provider.completeStructured).toHaveBeenCalledTimes(2);
  });

  it.each([
    { text: 'Space', targetLength: 'short' },
    { text: 'Space', level: null, targetLength: 'short' },
    { text: 'Space', level: '', targetLength: 'short' },
    { text: ' ', level: 'A2', targetLength: 'short' },
    { text: 'Space', level: 'invalid', targetLength: 'short' },
    { text: 'Space', level: 'A2' },
    { text: 'Space', level: 'A2', targetLength: null },
    { text: 'Space', level: 'A2', targetLength: '' },
    { text: 'Space', level: 'A2', targetLength: 'invalid' },
  ])('validates request %# before provider access', async (body) => {
    const response = await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send(body)
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
    });
    expect(testApp.provider.completeStructured).not.toHaveBeenCalled();
  });
});
