import request, { type Response } from 'supertest';
import {
  AUTH_TEST_NOW,
  createAuthHttpApp,
  type AuthHttpTestApp,
  AUTH_TEST_EMAIL,
  AUTH_TEST_PASSWORD,
  AUTH_TEST_CODE,
  AUTH_TEST_RESET_TOKEN,
} from './testing/create-auth-http-app';
import { createAuthResponseAssertion } from './testing/create-auth-response-assertion';

describe('Password reset credentials HTTP contract', () => {
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
  it.each([true, false])(
    'preserves the delivery acknowledgment when account existence is %s',
    async (exists) => {
      testApp.users.findByEmail.mockResolvedValue(
        exists ? testApp.user : undefined,
      );
      await request(testApp.server)
        .post('/auth/request-password-reset')
        .send({ email: AUTH_TEST_EMAIL })
        .expect(201, {
          email: AUTH_TEST_EMAIL,
          verificationExpiresAt: '2026-11-03T12:15:00.000Z',
        })
        .expect((response: Response) =>
          assertResponse('requestPasswordReset', response),
        );
      expect(testApp.sendPasswordResetCode).toHaveBeenCalledTimes(
        exists ? 1 : 0,
      );
    },
  );
  it('exchanges a verified code for the documented reset credential', async () => {
    testApp.resets.findByEmail.mockResolvedValue(testApp.reset);
    await request(testApp.server)
      .post('/auth/verify-password-reset-code')
      .send({ email: AUTH_TEST_EMAIL, code: AUTH_TEST_CODE })
      .expect(201)
      .expect((response: Response) =>
        assertResponse('verifyPasswordResetCode', response),
      );
  });
  it('documents a missing reset-code request', async () => {
    await request(testApp.server)
      .post('/auth/verify-password-reset-code')
      .send({ email: AUTH_TEST_EMAIL, code: AUTH_TEST_CODE })
      .expect(400)
      .expect((response: Response) => {
        expect(response.body).toHaveProperty('code', 'AUTH_RESET_CODE_INVALID');
        assertResponse('verifyPasswordResetCode', response);
      });
  });
  it('changes a password with a valid reset credential and returns only email', async () => {
    testApp.resets.findByEmail.mockResolvedValue(testApp.reset);
    testApp.users.findByEmail.mockResolvedValue(testApp.user);
    await request(testApp.server)
      .post('/auth/reset-password')
      .send({
        email: AUTH_TEST_EMAIL,
        password: AUTH_TEST_PASSWORD,
        passwordConfirmation: AUTH_TEST_PASSWORD,
        resetToken: AUTH_TEST_RESET_TOKEN,
      })
      .expect(201, { email: AUTH_TEST_EMAIL })
      .expect((response: Response) =>
        assertResponse('resetPassword', response),
      );
    expect(testApp.users.updatePassword).toHaveBeenCalled();
  });
  it('documents an invalid reset credential', async () => {
    await request(testApp.server)
      .post('/auth/reset-password')
      .send({
        email: AUTH_TEST_EMAIL,
        password: AUTH_TEST_PASSWORD,
        passwordConfirmation: AUTH_TEST_PASSWORD,
        resetToken: AUTH_TEST_RESET_TOKEN,
      })
      .expect(400)
      .expect((response: Response) => {
        expect(response.body).toHaveProperty(
          'code',
          'AUTH_RESET_REQUEST_INVALID',
        );
        assertResponse('resetPassword', response);
      });
  });
});
