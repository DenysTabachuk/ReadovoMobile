import { Logger } from '@nestjs/common';
import request from 'supertest';

import { AiResponseContractError } from '../infrastructure/ai.errors';
import {
  createArticleSimplifyHttpApp,
  type ArticleSimplifyHttpTestApp,
} from '../testing/create-article-simplify-http-app';

const path = '/api/articles/simplify';
const body = { text: 'Space is vast.', transformationType: 'adaptation' };

describe('Article simplification errors (HTTP)', () => {
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
    jest.restoreAllMocks();
  });

  it('uses a generic 500 when configuration is missing', async () => {
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
    'maps client failure %# without returning or logging its diagnostics',
    async (error) => {
      const log = jest.spyOn(Logger.prototype, 'error');
      testApp.provider.completeStructured.mockRejectedValueOnce(error);
      await request(testApp.server).post(path).send(body).expect(502, {
        statusCode: 502,
        code: 'ARTICLES_SIMPLIFICATION_FAILED',
        message: 'Failed to simplify article.',
      });
      expect(JSON.stringify(log.mock.calls)).not.toContain(
        'PRIVATE_PROVIDER_DIAGNOSTICS',
      );
      expect(log).toHaveBeenCalledWith('Article simplification failed.');
      expect(
        testApp.prisma.articleSimplification.upsert,
      ).not.toHaveBeenCalled();
    },
  );

  it('keeps semantic retry exhaustion a 502 and does not persist unusable output', async () => {
    testApp.provider.completeStructured.mockResolvedValue({
      adaptedBlocks: [],
      questions: null,
    });
    await request(testApp.server).post(path).send(body).expect(502, {
      statusCode: 502,
      code: 'ARTICLES_SIMPLIFICATION_FAILED',
      message: 'Failed to simplify article.',
    });
    expect(testApp.provider.completeStructured).toHaveBeenCalledTimes(2);
    expect(testApp.prisma.articleSimplification.upsert).not.toHaveBeenCalled();
  });

  it('preserves 500 for a failed initial cache read', async () => {
    testApp.prisma.articleSimplification.findUnique.mockRejectedValueOnce(
      new Error('private DB read failure'),
    );
    await request(testApp.server).post(path).send(body).expect(500, {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    });
    expect(testApp.provider.completeStructured).not.toHaveBeenCalled();
  });

  it('preserves 502 for a failed cache write after generation', async () => {
    testApp.provider.completeStructured.mockResolvedValueOnce({
      adaptedBlocks: [{ type: 'heading', level: 1, text: 'Space' }],
      questions: null,
    });
    testApp.prisma.articleSimplification.upsert.mockRejectedValueOnce(
      new Error('private DB write failure'),
    );
    await request(testApp.server).post(path).send(body).expect(502, {
      statusCode: 502,
      code: 'ARTICLES_SIMPLIFICATION_FAILED',
      message: 'Failed to simplify article.',
    });
  });
});
