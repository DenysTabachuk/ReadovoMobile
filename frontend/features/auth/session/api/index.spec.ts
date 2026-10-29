import { AxiosError, AxiosHeaders } from 'axios';
import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';
import { api } from '.';
import { authSessionStore } from '../authTokenStorage/authSessionStore';
import { shouldRetryQuery } from '@/providers/queryProvider/utils/shouldRetryQuery';
import { QueryClient } from '@tanstack/react-query';

jest.mock('@/api', () => ({
  API_BASE_URL: 'https://api.example.test',
  HTTP_STATUS: { unauthorized: 401 },
}));
jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      values.delete(key);
    }),
  };
});

const ACCOUNT_A = { accessToken: 'access-A', refreshToken: 'refresh-A' };
const ACCOUNT_B = { accessToken: 'access-B', refreshToken: 'refresh-B' };
const ROTATED_A = {
  accessToken: 'rotated-access-A',
  refreshToken: 'rotated-refresh-A',
};
const WORDS_URL = 'https://api.example.test/api/dictionary/me/words';
const ACCESS_TOKEN_EXPIRED = {
  code: 'AUTH_ACCESS_TOKEN_EXPIRED',
  message: 'Access token has expired.',
};

describe('api session isolation', () => {
  it('adds JWT through an interceptor for relative Axios method calls', async () => {
    const adapter = mockHttpAdapter(api).mockResolvedValue(
      createHttpResponse({ currentStreak: 3 }),
    );
    await expect(api.get('/streak/profile/me')).resolves.toMatchObject({
      data: { currentStreak: 3 },
    });
    expect(adapter.mock.calls[0][0]).toMatchObject({
      url: 'https://api.example.test/streak/profile/me',
      headers: { Authorization: 'Bearer access-A' },
    });
  });

  it('shares refresh across simultaneous 401 responses and never authenticates the refresh call', async () => {
    const refreshing = Promise.withResolvers<void>();
    const refreshed =
      Promise.withResolvers<ReturnType<typeof createHttpResponse>>();
    const adapter = mockHttpAdapter(api).mockImplementation(async (config) => {
      if (config.url?.endsWith('/auth/refresh')) {
        refreshing.resolve();
        expect(config.headers.has('Authorization')).toBe(false);
        return refreshed.promise;
      }
      return config.headers.get('Authorization') === 'Bearer rotated-access-A'
        ? createHttpResponse({ saved: true })
        : createHttpResponse(ACCESS_TOKEN_EXPIRED, { status: 401 });
    });
    const first = api.post('/api/dictionary/me/words', { word: 'sun' });
    const second = api.get('/streak/profile/me');
    await refreshing.promise;
    refreshed.resolve(createHttpResponse(ROTATED_A));
    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(
      adapter.mock.calls.filter(([config]) =>
        config.url?.endsWith('/auth/refresh'),
      ),
    ).toHaveLength(1);
  });
  it.each([
    'https://attacker.example/steal',
    '//attacker.example/steal',
    'https://user:password@api.example.test/path',
  ])('rejects credential destinations outside the API: %s', async (url) => {
    const adapter = mockHttpAdapter(api);
    await expect(api(url)).rejects.toThrow('application API');
    expect(adapter).not.toHaveBeenCalled();
  });
  beforeEach(async () => {
    await authSessionStore.replace(ACCOUNT_A);
  });
  afterEach(() => jest.restoreAllMocks());

  it('cannot redirect credentials by overriding Axios baseURL or Basic auth', async () => {
    const adapter = mockHttpAdapter(api).mockResolvedValue(
      createHttpResponse([]),
    );
    const config = {
      baseURL: 'https://attacker.example',
      allowAbsoluteUrls: false,
      auth: { username: 'wrong', password: 'wrong' },
    };
    await api(WORDS_URL, config);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      url: WORDS_URL,
      baseURL: 'https://api.example.test',
      allowAbsoluteUrls: true,
      headers: { Authorization: 'Bearer access-A' },
    });
    expect(adapter.mock.calls[0][0].auth).toBeUndefined();
    expect(config.baseURL).toBe('https://attacker.example');
    expect(config.auth.username).toBe('wrong');
  });

  it('returns an ordinary response without mutating caller headers', async () => {
    const response = createHttpResponse('[]');
    const fetchMock = mockHttpAdapter(api).mockResolvedValue(response);
    const headers = new AxiosHeaders({ 'X-Request': 'original' });
    await expect(api(WORDS_URL, { headers })).resolves.toBe(response);
    const sentHeaders = fetchMock.mock.calls[0][0]?.headers as AxiosHeaders;
    expect(sentHeaders.get('Authorization')).toBe('Bearer access-A');
    expect(sentHeaders.get('X-Request')).toBe('original');
    expect(headers.has('Authorization')).toBe(false);
  });

  it('refreshes and retries a write once within the initiating session', async () => {
    const response = createHttpResponse('{"id":"saved-word"}');
    const fetchMock = mockHttpAdapter(api)
      .mockResolvedValueOnce(
        createHttpResponse(ACCESS_TOKEN_EXPIRED, { status: 401 }),
      )
      .mockResolvedValueOnce(createHttpResponse(JSON.stringify(ROTATED_A)))
      .mockResolvedValueOnce(response);
    const init = { method: 'POST', data: '{"word":"sun"}' };
    await expect(api(WORDS_URL, init)).resolves.toBe(response);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toMatchObject({
      url: 'https://api.example.test/auth/refresh',
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      data: '{"refreshToken":"refresh-A"}',
    });
    const retry = fetchMock.mock.calls[2][0];
    expect(retry?.method).toBe('post');
    expect(retry?.data).toBe(init.data);
    expect((retry?.headers as AxiosHeaders).get('Authorization')).toBe(
      'Bearer rotated-access-A',
    );
    expect(await authSessionStore.read()).toEqual(ROTATED_A);
  });

  it.each(['GET', 'POST'])(
    'does not retry a delayed %s 401 as another account',
    async (method) => {
      const firstResponse =
        Promise.withResolvers<ReturnType<typeof createHttpResponse>>();
      const started = Promise.withResolvers<void>();
      const fetchMock = mockHttpAdapter(api).mockImplementation(() => {
        started.resolve();
        return firstResponse.promise;
      });
      const pending = api(WORDS_URL, { method });
      const rejected = expect(pending).rejects.toMatchObject({
        name: 'AbortError',
      });
      await started.promise;
      await authSessionStore.clear();
      await authSessionStore.replace(ACCOUNT_B);
      firstResponse.resolve(
        createHttpResponse(ACCESS_TOKEN_EXPIRED, { status: 401 }),
      );
      await rejected;
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(await authSessionStore.read()).toEqual(ACCOUNT_B);
    },
  );

  it('discards a late successful read and prevents React Query retrying as B', async () => {
    const firstResponse =
      Promise.withResolvers<ReturnType<typeof createHttpResponse>>();
    const started = Promise.withResolvers<void>();
    const fetchMock = mockHttpAdapter(api).mockImplementation(() => {
      started.resolve();
      return firstResponse.promise;
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: shouldRetryQuery, retryDelay: 0 } },
    });
    const queryKey = ['dictionary', 'words', 'account-A'];
    const pending = client.fetchQuery({
      queryKey,
      queryFn: () => api(WORDS_URL),
    });
    const rejected = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await started.promise;
    await authSessionStore.replace(ACCOUNT_B);
    firstResponse.resolve(createHttpResponse('["A-word"]'));
    await rejected;
    expect(client.getQueryData(queryKey)).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    client.clear();
  });

  it('does not refresh or retry after logout without a new login', async () => {
    const firstResponse =
      Promise.withResolvers<ReturnType<typeof createHttpResponse>>();
    const started = Promise.withResolvers<void>();
    const fetchMock = mockHttpAdapter(api).mockImplementation(() => {
      started.resolve();
      return firstResponse.promise;
    });
    const pending = api(WORDS_URL);
    const rejected = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await started.promise;
    await authSessionStore.clear();
    firstResponse.resolve(
      createHttpResponse(ACCESS_TOKEN_EXPIRED, { status: 401 }),
    );
    await rejected;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await authSessionStore.read()).toEqual({
      accessToken: null,
      refreshToken: null,
    });
  });

  it('does not repeat the request if the retried response is also unauthorized', async () => {
    const denied = createHttpResponse(ACCESS_TOKEN_EXPIRED, { status: 401 });
    const fetchMock = mockHttpAdapter(api)
      .mockResolvedValueOnce(
        createHttpResponse(ACCESS_TOKEN_EXPIRED, { status: 401 }),
      )
      .mockResolvedValueOnce(createHttpResponse(JSON.stringify(ROTATED_A)))
      .mockResolvedValueOnce(denied);
    await expect(api(WORDS_URL)).rejects.toMatchObject({
      status: 401,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([200, 401, 500])(
    'never retries after changing accounts during refresh (%s)',
    async (status) => {
      const refreshResponse =
        Promise.withResolvers<ReturnType<typeof createHttpResponse>>();
      const refreshing = Promise.withResolvers<void>();
      const fetchMock = mockHttpAdapter(api)
        .mockResolvedValueOnce(
          createHttpResponse(ACCESS_TOKEN_EXPIRED, { status: 401 }),
        )
        .mockImplementationOnce(() => {
          refreshing.resolve();
          return refreshResponse.promise;
        });
      const pending = api(WORDS_URL, {
        method: 'POST',
        data: '{"word":"sun"}',
      });
      const rejected = expect(pending).rejects.toMatchObject({
        name: 'AbortError',
      });
      await refreshing.promise;
      await authSessionStore.replace(ACCOUNT_B);
      refreshResponse.resolve(
        createHttpResponse(
          status === 200
            ? ROTATED_A
            : {
                code:
                  status === 401 ? 'AUTH_REFRESH_REJECTED' : 'INTERNAL_ERROR',
              },
          { status },
        ),
      );
      await rejected;
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(await authSessionStore.read()).toEqual(ACCOUNT_B);
    },
  );

  it('discards a retry response that completes after the session changes', async () => {
    const retryResponse =
      Promise.withResolvers<ReturnType<typeof createHttpResponse>>();
    const retrying = Promise.withResolvers<void>();
    const fetchMock = mockHttpAdapter(api)
      .mockResolvedValueOnce(
        createHttpResponse(ACCESS_TOKEN_EXPIRED, { status: 401 }),
      )
      .mockResolvedValueOnce(createHttpResponse(JSON.stringify(ROTATED_A)))
      .mockImplementationOnce(() => {
        retrying.resolve();
        return retryResponse.promise;
      });
    const pending = api(WORDS_URL);
    const rejected = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await retrying.promise;
    await authSessionStore.replace(ACCOUNT_B);
    retryResponse.resolve(createHttpResponse('["old-data"]'));
    await rejected;
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(
      (fetchMock.mock.calls[2][0]?.headers as AxiosHeaders).get(
        'Authorization',
      ),
    ).toBe('Bearer rotated-access-A');
  });

  it('does not send a request if the session changes while reading stored tokens', async () => {
    const fetchMock = mockHttpAdapter(api);
    const reading = Promise.withResolvers<void>();
    const tokens = Promise.withResolvers<typeof ACCOUNT_A>();
    jest.spyOn(authSessionStore, 'read').mockImplementationOnce(() => {
      reading.resolve();
      return tokens.promise;
    });
    const pending = api(WORDS_URL);
    const rejected = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await reading.promise;
    await authSessionStore.replace(ACCOUNT_B);
    tokens.resolve(ACCOUNT_A);
    await rejected;
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propagates a network error while the same session remains active', async () => {
    const error = new Error('Offline');
    mockHttpAdapter(api).mockRejectedValue(error);
    await expect(api(WORDS_URL)).rejects.toBe(error);
  });

  it('rejects a delayed network failure from an obsolete session with AbortError', async () => {
    const started = Promise.withResolvers<void>();
    const failed = Promise.withResolvers<void>();
    mockHttpAdapter(api).mockImplementation(async (config) => {
      started.resolve();
      await failed.promise;
      throw new AxiosError('Offline', AxiosError.ERR_NETWORK, config);
    });
    const rejected = expect(
      api.get('/streak/profile/me'),
    ).rejects.toMatchObject({ name: 'AbortError' });
    await started.promise;
    await authSessionStore.replace(ACCOUNT_B);
    failed.resolve();
    await rejected;
  });

  it('discards malformed responses after same-account relogin before JSON parsing', async () => {
    const started = Promise.withResolvers<void>();
    const response =
      Promise.withResolvers<ReturnType<typeof createHttpResponse>>();
    mockHttpAdapter(api).mockImplementation(() => {
      started.resolve();
      return response.promise;
    });
    const rejected = expect(
      api.get('/streak/profile/me'),
    ).rejects.toMatchObject({ name: 'AbortError' });
    await started.promise;
    await authSessionStore.replace(ACCOUNT_A);
    response.resolve(createHttpResponse('invalid JSON'));
    await rejected;
  });
});
