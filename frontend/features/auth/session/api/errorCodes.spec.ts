import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';

import { api } from '.';
import { authSessionStore } from '../authTokenStorage/authSessionStore';

jest.mock('@/api', () => ({
  API_BASE_URL: 'https://api.example.test',
  HTTP_STATUS: { unauthorized: 401 },
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);

const ACCOUNT = { accessToken: 'access-A', refreshToken: 'refresh-A' };
const ROTATED = {
  accessToken: 'rotated-access-A',
  refreshToken: 'rotated-refresh-A',
};

describe('Authenticated request refresh eligibility', () => {
  beforeEach(async () => {
    await authSessionStore.replace(ACCOUNT);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    'AUTH_AUTHENTICATION_REQUIRED',
    'AUTH_ACCESS_TOKEN_INVALID',
    'AUTH_ACCESS_TOKEN_EXPIRED',
  ])('refreshes once for HTTP 401/%s', async (code) => {
    const adapter = mockHttpAdapter(api)
      .mockResolvedValueOnce(
        createHttpResponse(
          { code, message: 'Wording does not control refresh.' },
          { status: 401 },
        ),
      )
      .mockResolvedValueOnce(createHttpResponse(ROTATED))
      .mockResolvedValueOnce(createHttpResponse({ ok: true }));
    await expect(api.get('/streak/profile/me')).resolves.toMatchObject({
      data: { ok: true },
    });
    expect(adapter).toHaveBeenCalledTimes(3);
    expect(adapter.mock.calls[1][0].url).toBe(
      'https://api.example.test/auth/refresh',
    );
    expect(await authSessionStore.read()).toEqual(ROTATED);
  });

  it.each([
    { status: 401, data: { code: 'AUTH_CREDENTIALS_INVALID' } },
    { status: 401, data: { code: 'AUTH_GOOGLE_IDENTITY_REJECTED' } },
    { status: 401, data: { code: 'AUTH_REFRESH_REJECTED' } },
    { status: 401, data: { code: 'FUTURE_ERROR_CODE' } },
    { status: 401, data: { code: '' } },
    { status: 401, data: { code: 42 } },
    { status: 401, data: {} },
    { status: 401, data: '<html>Proxy error</html>' },
    { status: 403, data: { code: 'AUTH_ACCESS_TOKEN_EXPIRED' } },
    { status: 500, data: { code: 'AUTH_ACCESS_TOKEN_EXPIRED' } },
  ])(
    'does not infer refresh from status/code for response %#',
    async ({ status, data }) => {
      const adapter = mockHttpAdapter(api).mockResolvedValueOnce(
        createHttpResponse(data, { status }),
      );
      await expect(api.get('/streak/profile/me')).rejects.toMatchObject({
        status,
      });
      expect(adapter).toHaveBeenCalledTimes(1);
      expect(await authSessionStore.read()).toEqual(ACCOUNT);
    },
  );

  it('propagates a temporary refresh failure without retrying the original request or clearing tokens', async () => {
    const adapter = mockHttpAdapter(api)
      .mockResolvedValueOnce(
        createHttpResponse(
          { code: 'AUTH_ACCESS_TOKEN_EXPIRED' },
          { status: 401 },
        ),
      )
      .mockResolvedValueOnce(
        createHttpResponse({ code: 'INTERNAL_ERROR' }, { status: 500 }),
      );
    await expect(
      api.post('/api/dictionary/me/words', { word: 'sun' }),
    ).rejects.toMatchObject({ status: 500, code: 'INTERNAL_ERROR' });
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(await authSessionStore.read()).toEqual(ACCOUNT);
  });

  it('clears the initiating session after an explicitly rejected refresh', async () => {
    const adapter = mockHttpAdapter(api)
      .mockResolvedValueOnce(
        createHttpResponse(
          { code: 'AUTH_ACCESS_TOKEN_EXPIRED' },
          { status: 401 },
        ),
      )
      .mockResolvedValueOnce(
        createHttpResponse({ code: 'AUTH_REFRESH_REJECTED' }, { status: 401 }),
      );
    // Clearing the session invalidates the initiating request, as with logout.
    await expect(api.get('/streak/profile/me')).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(await authSessionStore.read()).toEqual({
      accessToken: null,
      refreshToken: null,
    });
  });
});
