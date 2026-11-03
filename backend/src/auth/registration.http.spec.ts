import request, { type Response } from 'supertest';
import {
  AUTH_TEST_NOW,
  createAuthHttpApp,
  type AuthHttpTestApp,
  AUTH_TEST_EMAIL,
  AUTH_TEST_PASSWORD,
  AUTH_TEST_CODE,
} from './testing/create-auth-http-app';
import { createAuthResponseAssertion } from './testing/create-auth-response-assertion';

describe('Registration and email verification HTTP contract', () => {
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
  it('returns only a normalized email and serialized code expiry on registration', async () => {
    await request(testApp.server)
      .post('/auth/register')
      .send({
        email: ' READER@EXAMPLE.TEST ',
        password: AUTH_TEST_PASSWORD,
        passwordConfirmation: AUTH_TEST_PASSWORD,
      })
      .expect(201, {
        email: AUTH_TEST_EMAIL,
        verificationExpiresAt: '2026-11-03T12:15:00.000Z',
      })
      .expect((response: Response) => assertResponse('registerUser', response));
  });
  it('documents an existing email conflict', async () => {
    testApp.users.findByEmail.mockResolvedValue(testApp.user);
    await request(testApp.server)
      .post('/auth/register')
      .send({
        email: AUTH_TEST_EMAIL,
        password: AUTH_TEST_PASSWORD,
        passwordConfirmation: AUTH_TEST_PASSWORD,
      })
      .expect(409)
      .expect((response: Response) => assertResponse('registerUser', response));
  });
  it('validates password confirmation before registration', async () => {
    await request(testApp.server)
      .post('/auth/register')
      .send({
        email: AUTH_TEST_EMAIL,
        password: AUTH_TEST_PASSWORD,
        passwordConfirmation: 'different-password',
      })
      .expect(400)
      .expect((response: Response) => assertResponse('registerUser', response));
    expect(testApp.registrations.create).not.toHaveBeenCalled();
  });
  it('resends a pending registration code with the shared delivery shape', async () => {
    testApp.registrations.findByEmail.mockResolvedValue(testApp.pending);
    await request(testApp.server)
      .post('/auth/resend-verification-code')
      .send({ email: AUTH_TEST_EMAIL })
      .expect(201, {
        email: AUTH_TEST_EMAIL,
        verificationExpiresAt: '2026-11-03T12:15:00.000Z',
      })
      .expect((response: Response) =>
        assertResponse('resendVerificationCode', response),
      );
  });
  it('verifies a code and returns a session rather than a delivery acknowledgment', async () => {
    testApp.registrations.findByEmail.mockResolvedValue(testApp.pending);
    await request(testApp.server)
      .post('/auth/verify-email')
      .send({ email: AUTH_TEST_EMAIL, code: AUTH_TEST_CODE })
      .expect(201)
      .expect((response: Response) => assertResponse('verifyEmail', response));
  });
  it('documents an expired verification code', async () => {
    testApp.registrations.findByEmail.mockResolvedValue({
      ...testApp.pending,
      verificationExpiresAt: '2026-11-03T11:59:00.000Z',
    });
    await request(testApp.server)
      .post('/auth/verify-email')
      .send({ email: AUTH_TEST_EMAIL, code: AUTH_TEST_CODE })
      .expect(400)
      .expect((response: Response) => {
        expect(response.body).toHaveProperty(
          'code',
          'AUTH_VERIFICATION_CODE_EXPIRED',
        );
        assertResponse('verifyEmail', response);
      });
  });
});
