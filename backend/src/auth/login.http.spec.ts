import request, { type Response } from 'supertest';
import {
  AUTH_TEST_NOW,
  createAuthHttpApp,
  type AuthHttpTestApp,
  AUTH_TEST_EMAIL,
  AUTH_TEST_PASSWORD,
} from './testing/create-auth-http-app';
import { createAuthResponseAssertion } from './testing/create-auth-response-assertion';

describe('Email login HTTP contract', () => {
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
  it('returns a serialized session without stored password fields', async () => {
    testApp.users.findByEmail.mockResolvedValue(testApp.user);
    await request(testApp.server)
      .post('/auth/login')
      .send({ email: ' READER@EXAMPLE.TEST ', password: AUTH_TEST_PASSWORD })
      .expect(201)
      .expect((response: Response) => {
        assertResponse('loginUser', response);
        expect(response.body).toHaveProperty('user.email', AUTH_TEST_EMAIL);
        expect(response.body).not.toHaveProperty('user.passwordHash');
        expect(response.body).not.toHaveProperty('user.passwordSalt');
      });
  });
  it('rejects incorrect credentials without requiring a Bearer header', async () => {
    await request(testApp.server)
      .post('/auth/login')
      .send({ email: AUTH_TEST_EMAIL, password: AUTH_TEST_PASSWORD })
      .expect(401)
      .expect((response: Response) => {
        expect(response.body).toHaveProperty(
          'code',
          'AUTH_CREDENTIALS_INVALID',
        );
        assertResponse('loginUser', response);
      });
  });
  it('does not trim passwords', async () => {
    testApp.users.findByEmail.mockResolvedValue(testApp.user);
    await request(testApp.server)
      .post('/auth/login')
      .send({ email: AUTH_TEST_EMAIL, password: ' ' + AUTH_TEST_PASSWORD })
      .expect(401)
      .expect((response: Response) => assertResponse('loginUser', response));
  });
  it('rejects unknown request properties before persistence', async () => {
    await request(testApp.server)
      .post('/auth/login')
      .send({
        email: AUTH_TEST_EMAIL,
        password: AUTH_TEST_PASSWORD,
        admin: true,
      })
      .expect(400)
      .expect((response: Response) => assertResponse('loginUser', response));
    expect(testApp.users.findByEmail).not.toHaveBeenCalled();
  });
});
