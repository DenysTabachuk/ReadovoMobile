import { authenticatedFetch } from '.';
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

describe('authenticatedFetch session isolation', () => {
  beforeEach(async () => {
    await authSessionStore.replace(ACCOUNT_A);
  });
  afterEach(() => jest.restoreAllMocks());

  it('returns an ordinary response without mutating caller headers', async () => {
    const response = new Response('[]');
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(response);
    const headers = new Headers({ 'X-Request': 'original' });
    await expect(authenticatedFetch(WORDS_URL, { headers })).resolves.toBe(
      response,
    );
    const sentHeaders = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(sentHeaders.get('Authorization')).toBe('Bearer access-A');
    expect(sentHeaders.get('X-Request')).toBe('original');
    expect(headers.has('Authorization')).toBe(false);
  });

  it('refreshes and retries a write once within the initiating session', async () => {
    const response = new Response('{"id":"saved-word"}');
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(ROTATED_A)))
      .mockResolvedValueOnce(response);
    const init = { method: 'POST', body: '{"word":"sun"}' };
    await expect(authenticatedFetch(WORDS_URL, init)).resolves.toBe(response);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]).toEqual([
      'https://api.example.test/auth/refresh',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"refreshToken":"refresh-A"}',
        signal: expect.any(AbortSignal),
      },
    ]);
    const retry = fetchMock.mock.calls[2][1];
    expect(retry?.method).toBe('POST');
    expect(retry?.body).toBe(init.body);
    expect((retry?.headers as Headers).get('Authorization')).toBe(
      'Bearer rotated-access-A',
    );
    expect(await authSessionStore.read()).toEqual(ROTATED_A);
  });

  it.each(['GET', 'POST'])(
    'does not retry a delayed %s 401 as another account',
    async (method) => {
      const firstResponse = Promise.withResolvers<Response>();
      const started = Promise.withResolvers<void>();
      const fetchMock = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(() => {
          started.resolve();
          return firstResponse.promise;
        });
      const pending = authenticatedFetch(WORDS_URL, { method });
      const rejected = expect(pending).rejects.toMatchObject({
        name: 'AbortError',
      });
      await started.promise;
      await authSessionStore.clear();
      await authSessionStore.replace(ACCOUNT_B);
      firstResponse.resolve(new Response('', { status: 401 }));
      await rejected;
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(await authSessionStore.read()).toEqual(ACCOUNT_B);
    },
  );

  it('discards a late successful read and prevents React Query retrying as B', async () => {
    const firstResponse = Promise.withResolvers<Response>();
    const started = Promise.withResolvers<void>();
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
      started.resolve();
      return firstResponse.promise;
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: shouldRetryQuery, retryDelay: 0 } },
    });
    const queryKey = ['dictionary', 'words', 'account-A'];
    const pending = client.fetchQuery({
      queryKey,
      queryFn: () => authenticatedFetch(WORDS_URL),
    });
    const rejected = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await started.promise;
    await authSessionStore.replace(ACCOUNT_B);
    firstResponse.resolve(new Response('["A-word"]'));
    await rejected;
    expect(client.getQueryData(queryKey)).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    client.clear();
  });

  it('does not refresh or retry after logout without a new login', async () => {
    const firstResponse = Promise.withResolvers<Response>();
    const started = Promise.withResolvers<void>();
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
      started.resolve();
      return firstResponse.promise;
    });
    const pending = authenticatedFetch(WORDS_URL);
    const rejected = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await started.promise;
    await authSessionStore.clear();
    firstResponse.resolve(new Response('', { status: 401 }));
    await rejected;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await authSessionStore.read()).toEqual({
      accessToken: null,
      refreshToken: null,
    });
  });

  it('does not repeat the request if the retried response is also unauthorized', async () => {
    const denied = new Response('', { status: 401 });
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(ROTATED_A)))
      .mockResolvedValueOnce(denied);
    await expect(authenticatedFetch(WORDS_URL)).resolves.toBe(denied);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([200, 401])(
    'never retries after changing accounts during refresh (%s)',
    async (status) => {
      const refreshResponse = Promise.withResolvers<Response>();
      const refreshing = Promise.withResolvers<void>();
      const fetchMock = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response('', { status: 401 }))
        .mockImplementationOnce(() => {
          refreshing.resolve();
          return refreshResponse.promise;
        });
      const pending = authenticatedFetch(WORDS_URL, {
        method: 'POST',
        body: '{"word":"sun"}',
      });
      const rejected = expect(pending).rejects.toMatchObject({
        name: 'AbortError',
      });
      await refreshing.promise;
      await authSessionStore.replace(ACCOUNT_B);
      refreshResponse.resolve(
        new Response(JSON.stringify(ROTATED_A), { status }),
      );
      await rejected;
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(await authSessionStore.read()).toEqual(ACCOUNT_B);
    },
  );

  it('discards a retry response that completes after the session changes', async () => {
    const retryResponse = Promise.withResolvers<Response>();
    const retrying = Promise.withResolvers<void>();
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(ROTATED_A)))
      .mockImplementationOnce(() => {
        retrying.resolve();
        return retryResponse.promise;
      });
    const pending = authenticatedFetch(WORDS_URL);
    const rejected = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await retrying.promise;
    await authSessionStore.replace(ACCOUNT_B);
    retryResponse.resolve(new Response('["old-data"]'));
    await rejected;
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(
      (fetchMock.mock.calls[2][1]?.headers as Headers).get('Authorization'),
    ).toBe('Bearer rotated-access-A');
  });

  it('does not send a request if the session changes while reading stored tokens', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    const pending = authenticatedFetch(WORDS_URL);
    const rejected = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await authSessionStore.replace(ACCOUNT_B);
    await rejected;
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propagates a network error while the same session remains active', async () => {
    const error = new Error('Offline');
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(error);
    await expect(authenticatedFetch(WORDS_URL)).rejects.toBe(error);
  });
});
