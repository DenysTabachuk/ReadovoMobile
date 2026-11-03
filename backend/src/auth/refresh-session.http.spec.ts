import request, { type Response } from 'supertest';
import {
  AUTH_TEST_NOW,
  createAuthHttpApp,
  type AuthHttpTestApp,
} from './testing/create-auth-http-app';
import { createAuthResponseAssertion } from './testing/create-auth-response-assertion';

describe('Refresh credential rotation HTTP contract', () => {
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
  it('rotates a valid body credential without an access JWT', async () => {
    testApp.refreshTokens.findActiveByUserId.mockResolvedValue([
      testApp.refreshRecord,
    ]);
    testApp.users.findById.mockResolvedValue(testApp.user);
    await request(testApp.server)
      .post('/auth/refresh')
      .send({ refreshToken: testApp.refreshToken })
      .expect(201)
      .expect((response: Response) => {
        assertResponse('refreshAuthSession', response);
        expect(response.body).not.toHaveProperty(
          'refreshToken',
          testApp.refreshToken,
        );
      });
    expect(testApp.refreshTokens.revoke).toHaveBeenCalledWith(
      testApp.refreshRecord.id,
    );
  });
  it('rejects an unknown refresh credential', async () => {
    await request(testApp.server)
      .post('/auth/refresh')
      .send({ refreshToken: testApp.refreshToken })
      .expect(401)
      .expect((response: Response) => {
        expect(response.body).toHaveProperty('code', 'AUTH_REFRESH_REJECTED');
        assertResponse('refreshAuthSession', response);
      });
  });
  it('rejects an empty credential through DTO validation', async () => {
    await request(testApp.server)
      .post('/auth/refresh')
      .send({ refreshToken: '  ' })
      .expect(400)
      .expect((response: Response) =>
        assertResponse('refreshAuthSession', response),
      );
    expect(testApp.refreshTokens.findActiveByUserId).not.toHaveBeenCalled();
  });
});
