import { HttpError } from '@/api/httpError';
import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';

import { refreshAuthSession } from '.';
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

describe('Refresh error codes and token retention', () => {
  beforeEach(async () => {
    await authSessionStore.replace(ACCOUNT);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    { status: 500, data: { code: 'INTERNAL_ERROR' } },
    { status: 401, data: {} },
    { status: 401, data: { code: 42 } },
    { status: 401, data: { code: 'FUTURE_ERROR_CODE' } },
    { status: 401, data: { code: 'AUTH_ACCESS_TOKEN_EXPIRED' } },
    { status: 403, data: { code: 'AUTH_REFRESH_REJECTED' } },
    { status: 500, data: { code: 'AUTH_REFRESH_REJECTED' } },
  ])(
    'retains the session and propagates unsupported refresh failure %#',
    async ({ status, data }) => {
      mockHttpAdapter().mockResolvedValueOnce(
        createHttpResponse(data, { status }),
      );
      const version = authSessionStore.version;
      await expect(refreshAuthSession()).rejects.toMatchObject({ status });
      expect(authSessionStore.version).toBe(version);
      expect(await authSessionStore.read()).toEqual(ACCOUNT);
    },
  );

  it('releases a temporary HTTP failure so a later call can refresh', async () => {
    mockHttpAdapter()
      .mockResolvedValueOnce(
        createHttpResponse({ code: 'INTERNAL_ERROR' }, { status: 500 }),
      )
      .mockResolvedValueOnce(createHttpResponse(ROTATED));
    await expect(refreshAuthSession()).rejects.toBeInstanceOf(HttpError);
    expect(await authSessionStore.read()).toEqual(ACCOUNT);
    await expect(refreshAuthSession()).resolves.toEqual(ROTATED);
  });

  it.each([
    null,
    {},
    { accessToken: '', refreshToken: 'refresh' },
    { accessToken: 'access', refreshToken: 42 },
  ])(
    'does not overwrite tokens with malformed successful response %#',
    async (data) => {
      mockHttpAdapter().mockResolvedValueOnce(createHttpResponse(data));
      await expect(refreshAuthSession()).rejects.toThrow(
        'Invalid refresh response.',
      );
      expect(await authSessionStore.read()).toEqual(ACCOUNT);
    },
  );
});
