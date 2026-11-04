import request, { type Response } from 'supertest';
import Ajv, { type ValidateFunction } from 'ajv';

import { JwtService } from '../auth/jwt.service';
import { exportOpenApi } from '../openapi/export-openapi';

import {
  createAchievementsHttpApp,
  ACHIEVEMENTS_TEST_USER_ID,
  type AchievementsHttpTestApp,
} from './testing/create-achievements-http-app';

const path = '/achievements/profile/me';
const EXPIRED_TOKEN_AGE_MS = 60 * 60 * 1000;

describe('Achievements profile errors and authorization (HTTP)', () => {
  let testApp: AchievementsHttpTestApp;
  const responseValidators = new Map<string, ValidateFunction<unknown>>();

  beforeAll(async () => {
    const document = await exportOpenApi();
    const validator = new Ajv({ strict: false, allErrors: true });
    // This service serializes dates with toISOString(), including milliseconds.
    validator.addFormat(
      'date-time',
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    validator.addSchema(document, 'achievements');
    const responses = document.paths[path]?.get?.responses ?? {};
    for (const status of Object.keys(responses)) {
      responseValidators.set(
        status,
        validator.compile<unknown>({
          $ref: `achievements#/paths/~1achievements~1profile~1me/get/responses/${status}/content/application~1json/schema`,
        }),
      );
    }
  });

  function expectDocumentedResponse(response: Response): void {
    const validate = responseValidators.get(String(response.status));
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
    testApp = await createAchievementsHttpApp();
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    await testApp.app.close();
  });

  it.each([{ method: 'get', suffix: '', body: {} }] as const)(
    'returns a domain 404 for a missing user on $method $suffix',
    async ({ method, suffix, body }) => {
      testApp.prisma.user.findUnique.mockResolvedValue(null);
      await request(testApp.server)
        [method](`${path}${suffix}`)
        .set('Authorization', testApp.authorization)
        .send(body)
        .expect(404, {
          statusCode: 404,
          code: 'ACHIEVEMENTS_USER_NOT_FOUND',
          message: 'User not found.',
        })
        .expect(expectDocumentedResponse);
      expect(testApp.prisma.user.updateMany).not.toHaveBeenCalled();
      expect(testApp.prisma.userAchievement.findMany).not.toHaveBeenCalled();
    },
  );

  it('keeps the profile shape and learned-word count source unchanged', async () => {
    const response = await request(testApp.server)
      .get(path)
      .set('Authorization', testApp.authorization)
      .expect(200)
      .expect(expectDocumentedResponse);
    expect(response.body).toMatchObject({
      userId: ACHIEVEMENTS_TEST_USER_ID,
      progress: {
        balance: 25,
        lessonsCompleted: 2,
        testsCompleted: 0,
        wordsLearned: 3,
      },
    });
    expect(response.body).toHaveProperty('achievements.length', 4);
    expect(response.body).not.toHaveProperty('code');
    expect(response.body).toHaveProperty('achievements.0.claimedAt', null);
    expect(response.body).toHaveProperty('achievements.0.unlockedAt', null);
    expect(testApp.prisma.dictionaryWord.count).toHaveBeenCalledWith({
      where: { progress: 'learned', userId: ACHIEVEMENTS_TEST_USER_ID },
    });
    expect(testApp.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects missing authentication before persistence', async () => {
    await request(testApp.server)
      .get(path)
      .expect(401, {
        statusCode: 401,
        code: 'AUTH_AUTHENTICATION_REQUIRED',
        message: 'Authentication is required.',
      })
      .expect(expectDocumentedResponse);
    expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('serializes stored dates as required ISO strings and preserves null claims', async () => {
    testApp.prisma.userAchievement.findMany.mockResolvedValue([
      {
        achievementId: 'first_test_completed',
        userId: ACHIEVEMENTS_TEST_USER_ID,
        unlockedAt: new Date('2026-10-28T12:00:00.000Z'),
        claimedAt: new Date('2026-10-28T12:01:00.000Z'),
      },
      {
        achievementId: 'ten_tests_completed',
        userId: ACHIEVEMENTS_TEST_USER_ID,
        unlockedAt: new Date('2026-10-29T12:00:00.000Z'),
        claimedAt: null,
      },
    ]);
    const response = await request(testApp.server)
      .get(path)
      .set('Authorization', testApp.authorization)
      .expect(200)
      .expect(expectDocumentedResponse);
    expect(response.body).toHaveProperty(
      'achievements.0.unlockedAt',
      '2026-10-28T12:00:00.000Z',
    );
    expect(response.body).toHaveProperty(
      'achievements.0.claimedAt',
      '2026-10-28T12:01:00.000Z',
    );
    expect(response.body).toHaveProperty('achievements.1.claimedAt', null);
  });

  it('documents rejection of an invalid token before persistence', async () => {
    await request(testApp.server)
      .get(path)
      .set('Authorization', 'Bearer invalid-token')
      .expect(401, {
        statusCode: 401,
        code: 'AUTH_ACCESS_TOKEN_INVALID',
        message: 'Access token is invalid.',
      })
      .expect(expectDocumentedResponse);
    expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('documents rejection of an expired token before persistence', async () => {
    const clock = jest
      .spyOn(Date, 'now')
      .mockReturnValue(Date.now() - EXPIRED_TOKEN_AGE_MS);
    const { accessToken } = testApp.app.get(JwtService).issueAccessToken({
      ...testApp.user,
      id: ACHIEVEMENTS_TEST_USER_ID,
      email: 'reader@example.test',
      createdAt: '2026-10-28T12:00:00.000Z',
    });
    clock.mockRestore();
    await request(testApp.server)
      .get(path)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401, {
        statusCode: 401,
        code: 'AUTH_ACCESS_TOKEN_EXPIRED',
        message: 'Access token has expired.',
      })
      .expect(expectDocumentedResponse);
    expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('documents malformed JSON rejected by the global parser', async () => {
    await request(testApp.server)
      .get(path)
      .set('Content-Type', 'application/json')
      .send('{')
      .expect(400, {
        statusCode: 400,
        code: 'REQUEST_MALFORMED',
        message: 'Malformed request body.',
      })
      .expect(expectDocumentedResponse);
    expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('hides unexpected progress-query failures', async () => {
    testApp.prisma.dictionaryWord.count.mockRejectedValue(
      new Error('secret database details'),
    );
    await request(testApp.server)
      .get(path)
      .set('Authorization', testApp.authorization)
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      })
      .expect(expectDocumentedResponse);
  });
});
