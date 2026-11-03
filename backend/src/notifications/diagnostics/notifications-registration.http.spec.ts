import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SwaggerModule } from '@nestjs/swagger';
import { type Server } from 'node:http';
import request from 'supertest';

import { AppModule } from '../../app.module';
import { JwtService } from '../../auth/jwt.service';
import { configureApiBoundaries } from '../../common/configure-api-boundaries';
import { DOCUMENTED_API_MODULES } from '../../openapi/documented-modules';
import { createApiDocument } from '../../openapi/utils/createApiDocument';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications.service';

// Replace only the native model-loading boundary before importing the app root.
jest.mock('../../dictionary/dictionary-embedding.service', () => ({
  DictionaryEmbeddingService: class DictionaryEmbeddingService {},
}));

const diagnosticRoutes = [
  { method: 'post', path: '/notifications/test-push/me' },
  {
    method: 'delete',
    path: '/notifications/learning-reminders/dispatch/today/me',
  },
  { method: 'post', path: '/notifications/learning-reminders/dispatch' },
] as const;

/**
 * Boots the real app composition with external persistence/worker boundaries stubbed.
 * @param environment - Explicit environment passed through the same root factory as main.
 * @returns Initialized app and token; caller closes the app. No DB, model download,
 * Firebase or worker is started. Controller registration and auth remain real.
 * @example
 * const testApp = await createRegistrationApp('production');
 * // POST /notifications/test-push/me returns ROUTE_NOT_FOUND, even with its token.
 * await testApp.app.close();
 */
async function createRegistrationApp(environment: string | undefined) {
  const notifications = {
    getLearningReminderPreferences: jest.fn().mockResolvedValue({
      learningReminderTime: '19:00',
      learningRemindersEnabled: false,
    }),
    sendTestPush: jest.fn().mockResolvedValue({
      tokenCount: 0,
      sentCount: 0,
      failedCount: 0,
      failureReasons: [],
    }),
  };
  const module = await Test.createTestingModule({
    imports: [AppModule.forEnvironment(environment)],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(NotificationsService)
    .useValue(notifications)
    .compile();
  const app = module.createNestApplication<INestApplication<Server>>({
    bodyParser: false,
    logger: false,
  });
  configureApiBoundaries(app);
  SwaggerModule.setup(
    'api/docs',
    app,
    createApiDocument(app, DOCUMENTED_API_MODULES),
  );
  try {
    await app.init();
  } catch (error) {
    await app.close();
    throw error;
  }
  const token = module.get(JwtService).issueAccessToken({
    id: '11111111-1111-4111-8111-111111111111',
    email: 'reader@example.test',
    createdAt: '2026-11-03T12:00:00.000Z',
    balance: 0,
    testsCompleted: 0,
    lessonsCompleted: 0,
    wordsLearned: 0,
  }).accessToken;
  return {
    app,
    server: app.getHttpServer(),
    authorization: `Bearer ${token}`,
    notifications,
  };
}

describe('Notification diagnostics application registration (HTTP)', () => {
  it.each(['production', 'test', 'staging'])(
    'omits diagnostic routes and Swagger operations in %s',
    async (environment) => {
      const testApp = await createRegistrationApp(environment);
      try {
        for (const route of diagnosticRoutes) {
          await request(testApp.server)[route.method](route.path).expect(404, {
            statusCode: 404,
            code: 'ROUTE_NOT_FOUND',
            message: 'Route not found.',
          });
          await request(testApp.server)
            [route.method](route.path)
            .set('Authorization', testApp.authorization)
            .expect(404, {
              statusCode: 404,
              code: 'ROUTE_NOT_FOUND',
              message: 'Route not found.',
            });
        }
        const response = await request(testApp.server)
          .get('/api/docs-json')
          .expect(200);
        for (const route of diagnosticRoutes)
          expect(response.body).not.toHaveProperty(['paths', route.path]);
        expect(testApp.notifications.sendTestPush).not.toHaveBeenCalled();
        await request(testApp.server)
          .get('/notifications/preferences/me')
          .set('Authorization', testApp.authorization)
          .expect(200, {
            learningReminderTime: '19:00',
            learningRemindersEnabled: false,
          });
      } finally {
        await testApp.app.close();
      }
    },
  );

  it.each(['development', undefined])(
    'registers authenticated diagnostics and their Swagger group in %s',
    async (environment) => {
      const testApp = await createRegistrationApp(environment);
      try {
        for (const route of diagnosticRoutes) {
          await request(testApp.server)[route.method](route.path).expect(401, {
            statusCode: 401,
            code: 'AUTH_AUTHENTICATION_REQUIRED',
            message: 'Authentication is required.',
          });
        }
        await request(testApp.server)
          .post('/notifications/test-push/me')
          .set('Authorization', testApp.authorization)
          .expect(201, {
            tokenCount: 0,
            sentCount: 0,
            failedCount: 0,
            failureReasons: [],
          });
        const response = await request(testApp.server)
          .get('/api/docs-json')
          .expect(200);
        for (const route of diagnosticRoutes) {
          expect(response.body).toHaveProperty(
            ['paths', route.path, route.method, 'tags'],
            ['Notification diagnostics'],
          );
        }
        expect(response.body).toHaveProperty(
          ['paths', '/notifications/preferences/me', 'get', 'tags'],
          ['notifications'],
        );
      } finally {
        await testApp.app.close();
      }
    },
  );
});
