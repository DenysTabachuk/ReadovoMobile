import { Logger } from '@nestjs/common';
import request from 'supertest';
import { z } from 'zod';
import { QuizService } from '../../quiz/quiz.service';

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

  it('creates an authenticated vocabulary session without exposing its answer key', async () => {
    testApp.provider.completeStructured.mockResolvedValueOnce(validOutput);
    const createSession = jest.spyOn(testApp.app.get(QuizService), 'create');
    const response = await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send(body)
      .expect(201);
    expect(response.body).toMatchObject({
      sessionId: '33333333-3333-4333-8333-333333333333',
      resolvedLevel: 'A2',
      questions: [
        {
          id: 'vq1',
          termKind: 'word',
          type: 'single_choice',
          format: 'translation',
        },
      ],
    });
    expect(response.body).not.toHaveProperty('code');
    const { questions } = z
      .object({
        questions: z.array(
          z.object({
            id: z.string(),
            options: z.array(
              z.object({ id: z.string().uuid(), text: z.string() }),
            ),
          }),
        ),
      })
      .parse(response.body);
    const question = questions[0];
    expect(new Set(question.options.map((option) => option.id)).size).toBe(4);
    const correctOption = question.options.find(
      (option) => option.text === 'ліс',
    );
    expect(correctOption).toBeDefined();
    if (!correctOption) throw new Error('Expected the translation option.');
    expect(createSession).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      expect.objectContaining({
        questions: [
          expect.objectContaining({
            id: 'vq1',
            optionIds: question.options.map((option) => option.id),
            correctOptionIds: [correctOption.id],
            vocabularyWord: {
              term: 'forest',
              translation: 'ліс',
              sourceExcerpt: undefined,
            },
          }),
        ],
      }),
    );
    for (const field of [
      'correctOptionIds',
      'explanation',
      'term',
      'translation',
      'sourceExcerpt',
    ]) {
      expect(response.body).not.toHaveProperty(`questions.0.${field}`);
    }
    expect(JSON.stringify(response.body)).not.toMatch(/:correct|:distractor/);
  });

  it('retains the explicitly requested level over the provider level', async () => {
    testApp.provider.completeStructured.mockResolvedValueOnce(validOutput);
    const response = await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send({ ...body, level: ' b1 ' })
      .expect(201);
    expect(response.body).toHaveProperty('resolvedLevel', 'B1');
  });

  it('keeps one semantic retry and accepts corrected vocabulary', async () => {
    testApp.provider.completeStructured
      .mockResolvedValueOnce({ resolvedLevel: 'A2', questions: [] })
      .mockResolvedValueOnce(validOutput);
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send(body)
      .expect(201);
    expect(testApp.provider.completeStructured).toHaveBeenCalledTimes(2);
  });

  it('returns a generic configuration failure', async () => {
    delete process.env.GROQ_API_KEY;
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send(body)
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
        .send(body)
        .expect(502, {
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
    await request(testApp.server)
      .post(path)
      .set('Authorization', testApp.authorization)
      .send(body)
      .expect(502, {
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
        .set('Authorization', testApp.authorization)
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
