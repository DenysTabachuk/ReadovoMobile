import request from 'supertest';

import { type ArticleTransformationOutput } from '../contracts/ai-output.schemas';
import {
  createArticleSimplifyHttpApp,
  type ArticleSimplifyHttpTestApp,
} from '../testing/create-article-simplify-http-app';

const path = '/api/articles/simplify';
const questions: NonNullable<ArticleTransformationOutput['questions']> = [
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
];

describe('Article simplification requests and success (HTTP)', () => {
  let testApp: ArticleSimplifyHttpTestApp;
  let previousKey: string | undefined;
  beforeEach(async () => {
    previousKey = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = 'test-key';
    testApp = await createArticleSimplifyHttpApp();
  });
  afterEach(async () => {
    await testApp.app.close();
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
  });

  it.each(['adaptation', 'summary'] as const)(
    'preserves public %s generation and persistence',
    async (transformationType) => {
      testApp.provider.completeStructured.mockResolvedValueOnce({
        adaptedBlocks: [{ type: 'heading', level: 1, text: 'Space' }],
        questions: transformationType === 'summary' ? questions : null,
      });
      const response = await request(testApp.server)
        .post(path)
        .send({ text: ' Space is vast. ', transformationType })
        .expect(201);
      expect(response.body).toMatchObject({
        title: 'Untitled article',
        level: 'A2',
        transformationType,
        originalLength: 14,
        adaptedLength: 5,
        adaptedBlocks: [{ type: 'heading', level: 1, text: 'Space' }],
      });
      if (transformationType === 'summary')
        expect(response.body).toHaveProperty('questions.0.id', 'q1');
      else expect(response.body).not.toHaveProperty('questions');
      expect(response.body).not.toHaveProperty('code');
      expect(testApp.prisma.articleSimplification.upsert).toHaveBeenCalledTimes(
        1,
      );
    },
  );

  it('returns a cached response even without a provider key', async () => {
    delete process.env.GROQ_API_KEY;
    testApp.prisma.articleSimplification.findUnique.mockResolvedValueOnce({
      cacheKey: 'cached',
      articleId: 42,
      title: 'Space',
      level: 'A2',
      targetLength: 'adaptation',
      targetPercent: null,
      sourceHash: null,
      originalLength: 14,
      adaptedText: 'Space',
      adaptedLength: 5,
      adaptedBlocks: [{ type: 'heading', level: 1, text: 'Space' }],
      questions: null,
      createdAt: new Date('2026-10-29T12:00:00.000Z'),
    });
    await request(testApp.server)
      .post(path)
      .send({ text: 'Space is vast.', transformationType: 'adaptation' })
      .expect(201, {
        title: 'Space',
        level: 'A2',
        transformationType: 'adaptation',
        originalLength: 14,
        adaptedLength: 5,
        adaptedBlocks: [{ type: 'heading', level: 1, text: 'Space' }],
      });
    expect(testApp.provider.completeStructured).not.toHaveBeenCalled();
    expect(testApp.prisma.articleSimplification.upsert).not.toHaveBeenCalled();
  });

  it.each([
    { text: ' ' },
    { text: 42 },
    { text: 'Space', level: 'invalid' },
    { text: 'Space', transformationType: 'invalid' },
    { text: 'Space', articleId: 0 },
  ])('validates input %# before cache or provider access', async (body) => {
    const response = await request(testApp.server)
      .post(path)
      .send(body)
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
    });
    expect(
      testApp.prisma.articleSimplification.findUnique,
    ).not.toHaveBeenCalled();
    expect(testApp.provider.completeStructured).not.toHaveBeenCalled();
  });
});
