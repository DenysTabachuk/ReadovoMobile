import request, { type Response } from 'supertest';
import {
  AUTH_TEST_NOW,
  createAuthHttpApp,
  type AuthHttpTestApp,
  AUTH_TEST_EMAIL,
} from './testing/create-auth-http-app';
import { createAuthResponseAssertion } from './testing/create-auth-response-assertion';

describe('Google identity exchange HTTP contract', () => {
  let testApp: AuthHttpTestApp;
  let assertResponse: Awaited<ReturnType<typeof createAuthResponseAssertion>>;
  beforeAll(async () => {
    assertResponse = await createAuthResponseAssertion();
  });
  beforeEach(async () => {
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'clearTimeout'],
    });
    jest.setSystemTime(new Date(AUTH_TEST_NOW));
    testApp = await createAuthHttpApp();
  });
  afterEach(async () => {
    await testApp?.app.close();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });
  let previousAudience: string | undefined;
  beforeEach(() => {
    previousAudience = process.env.GOOGLE_WEB_CLIENT_ID;
    process.env.GOOGLE_WEB_CLIENT_ID = 'auth-http-client';
  });
  afterEach(() => {
    if (previousAudience === undefined) delete process.env.GOOGLE_WEB_CLIENT_ID;
    else process.env.GOOGLE_WEB_CLIENT_ID = previousAudience;
  });
  it('exchanges a verified provider identity for a session', async () => {
    testApp.users.findByEmail.mockResolvedValue(testApp.user);
    testApp.adapter.mockImplementation((config) =>
      Promise.resolve({
        config,
        data: {
          email_verified: 'true',
          email: AUTH_TEST_EMAIL,
          aud: 'auth-http-client',
        },
        headers: {},
        status: 200,
        statusText: 'OK',
      }),
    );
    await request(testApp.server)
      .post('/auth/google')
      .send({ idToken: 'provider-token' })
      .expect(201)
      .expect((response: Response) =>
        assertResponse('loginWithGoogle', response),
      );
  });
  it('documents rejection of an unverified provider identity', async () => {
    testApp.adapter.mockImplementation((config) =>
      Promise.resolve({
        config,
        data: {
          email_verified: 'false',
          email: AUTH_TEST_EMAIL,
          aud: 'auth-http-client',
        },
        headers: {},
        status: 200,
        statusText: 'OK',
      }),
    );
    await request(testApp.server)
      .post('/auth/google')
      .send({ idToken: 'provider-token' })
      .expect(401)
      .expect((response: Response) => {
        expect(response.body).toHaveProperty(
          'code',
          'AUTH_GOOGLE_IDENTITY_REJECTED',
        );
        assertResponse('loginWithGoogle', response);
      });
  });
});
