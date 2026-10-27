import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';

import { createAuthSessionClient } from '.';
import { authSessionStore } from '../../authTokenStorage/authSessionStore';
import { shouldRetryQuery } from '@/providers/queryProvider/utils/shouldRetryQuery';

jest.mock('@/api', () => ({
  API_BASE_URL: 'https://api.test',
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

const A = { accessToken: 'access-A', refreshToken: 'refresh-A' };
const B = { accessToken: 'access-B', refreshToken: 'refresh-B' };
const ROTATED = { accessToken: 'rotated-A', refreshToken: 'rotated-refresh-A' };
const URL = 'https://api.test/me';
const parse = async (response: Response): Promise<string> => response.text();

beforeEach(async () => {
  await authSessionStore.replace(A);
});
afterEach(() => jest.restoreAllMocks());

function client() {
  return createAuthSessionClient({
    ownerId: 'a',
    version: authSessionStore.version,
  });
}

it('eagerly parses and preserves frozen caller options, headers and signal', async () => {
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response('A-data'));
  const headers = new Headers({ Authorization: 'wrong', 'X-Custom': 'kept' });
  const signal = new AbortController().signal;
  const init = Object.freeze({
    method: 'POST',
    body: 'payload',
    headers,
    signal,
  });
  const session = client();
  await expect(session.request({ input: URL, init, parse })).resolves.toBe(
    'A-data',
  );
  expect(Object.isFrozen(session)).toBe(true);
  const sent = fetchMock.mock.calls[0][1]!;
  expect((sent.headers as Headers).get('Authorization')).toBe(
    'Bearer access-A',
  );
  expect((sent.headers as Headers).get('X-Custom')).toBe('kept');
  expect(sent).toMatchObject({ method: 'POST', body: 'payload' });
  expect(headers.get('Authorization')).toBe('wrong');
  expect(init.signal).toBe(signal);
});

it('cannot start the next request after replacement, including the same owner', async () => {
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response('first'));
  const session = client();
  await session.request({ input: URL, parse });
  await authSessionStore.replace(A);
  const read = jest.spyOn(authSessionStore, 'read');
  await expect(session.request({ input: URL, parse })).rejects.toMatchObject({
    name: 'AbortError',
  });
  expect(read).not.toHaveBeenCalled();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(session.isActive).toBe(false);
  expect(session.signal.aborted).toBe(true);
  expect(client().id).not.toBe(session.id);
});

it('aborts synchronously before logout storage completes', async () => {
  const removed = Promise.withResolvers<void>();
  jest
    .mocked(AsyncStorage.removeItem)
    .mockImplementationOnce(() => removed.promise);
  const session = client();
  const clearing = authSessionStore.clear();
  expect(session.signal.aborted).toBe(true);
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  await expect(session.request({ input: URL, parse })).rejects.toMatchObject({
    name: 'AbortError',
  });
  expect(fetchMock).not.toHaveBeenCalled();
  removed.resolve();
  await clearing;
});

it('does not send after replacement during asynchronous token access', async () => {
  const token = Promise.withResolvers<string | null>();
  const reading = Promise.withResolvers<void>();
  jest.mocked(AsyncStorage.getItem).mockImplementationOnce(() => {
    reading.resolve();
    return token.promise;
  });
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  const pending = client().request({ input: URL, parse });
  const rejected = expect(pending).rejects.toMatchObject({
    name: 'AbortError',
  });
  await reading.promise;
  const replacement = authSessionStore.replace(B);
  await rejected;
  token.resolve(A.accessToken);
  await replacement;
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each([200, 401])(
  'rejects a late %s response even when fetch ignores abort',
  async (status) => {
    const response = Promise.withResolvers<Response>();
    const started = Promise.withResolvers<void>();
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
      started.resolve();
      return response.promise;
    });
    const parser = jest.fn(parse);
    const pending = client().request({ input: URL, parse: parser });
    const rejected = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await started.promise;
    await authSessionStore.replace(B);
    await rejected;
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    response.resolve(new Response('old', { status }));
    expect(parser).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  },
);

it.each(['resolve', 'reject'] as const)(
  'rejects session replacement during parsing (%s)',
  async (settlement) => {
    const body = Promise.withResolvers<string>();
    const parsing = Promise.withResolvers<void>();
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());
    const pending = client().request({
      input: URL,
      parse: () => {
        parsing.resolve();
        return body.promise;
      },
    });
    const rejected = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await parsing.promise;
    await authSessionStore.replace(B);
    await rejected;
    if (settlement === 'resolve') body.resolve('old-data');
    else body.reject(new Error('late parser failure'));
  },
);

it('refreshes once and retries with rotated credentials without changing identity', async () => {
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(new Response('', { status: 401 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(ROTATED)))
    .mockResolvedValueOnce(new Response('rotated-data'));
  const session = client();
  const identity = session.id;
  await expect(session.request({ input: URL, parse })).resolves.toBe(
    'rotated-data',
  );
  expect(session.id).toBe(identity);
  expect(session.isActive).toBe(true);
  expect(
    (fetchMock.mock.calls[2][1]?.headers as Headers).get('Authorization'),
  ).toBe('Bearer rotated-A');
  expect(fetchMock.mock.calls[1][1]?.body).toBe('{"refreshToken":"refresh-A"}');
});

it.each([200, 401])(
  'cannot commit or clear B during delayed refresh (%s)',
  async (status) => {
    const refresh = Promise.withResolvers<Response>();
    const refreshing = Promise.withResolvers<void>();
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockImplementationOnce(() => {
        refreshing.resolve();
        return refresh.promise;
      });
    const pending = client().request({ input: URL, parse });
    const rejected = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await refreshing.promise;
    await authSessionStore.replace(B);
    await rejected;
    expect(fetchMock.mock.calls[1][1]?.signal?.aborted).toBe(true);
    refresh.resolve(new Response(JSON.stringify(ROTATED), { status }));
    expect(await authSessionStore.read()).toEqual(B);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  },
);

it('shares refresh while allowing one caller to cancel its wait', async () => {
  const refresh = Promise.withResolvers<Response>();
  const refreshing = Promise.withResolvers<void>();
  let reads = 0;
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input) => {
      if (String(input).endsWith('/auth/refresh')) {
        refreshing.resolve();
        return refresh.promise;
      }
      reads += 1;
      return reads <= 2
        ? new Response('', { status: 401 })
        : new Response('success');
    });
  const session = client();
  const caller = new AbortController();
  const first = session.request({
    input: URL,
    init: { signal: caller.signal },
    parse,
  });
  const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' });
  const second = session.request({ input: URL, parse });
  await refreshing.promise;
  caller.abort();
  await rejected;
  const refreshSignal = fetchMock.mock.calls.find(([input]) =>
    String(input).endsWith('/auth/refresh'),
  )![1]?.signal;
  expect(refreshSignal?.aborted).toBe(false);
  refresh.resolve(new Response(JSON.stringify(ROTATED)));
  await expect(second).resolves.toBe('success');
  expect(fetchMock).toHaveBeenCalledTimes(4);
  expect(session.isActive).toBe(true);
});

it('rejects a retry that finishes after replacement', async () => {
  const retry = Promise.withResolvers<Response>();
  const retrying = Promise.withResolvers<void>();
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(new Response('', { status: 401 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(ROTATED)))
    .mockImplementationOnce(() => {
      retrying.resolve();
      return retry.promise;
    });
  const pending = client().request({ input: URL, parse });
  const rejected = expect(pending).rejects.toMatchObject({
    name: 'AbortError',
  });
  await retrying.promise;
  await authSessionStore.replace(B);
  await rejected;
  retry.resolve(new Response('old retry'));
});

it('forwards React Query cancellation and does not retry as another session', async () => {
  const started = Promise.withResolvers<void>();
  const response = Promise.withResolvers<Response>();
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
    started.resolve();
    return response.promise;
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: shouldRetryQuery, retryDelay: 0 } },
  });
  const session = client();
  const queryKey = ['personal', 'a'];
  const pending = queryClient.fetchQuery({
    queryKey,
    queryFn: ({ signal }) =>
      session.request({ input: URL, init: { signal }, parse }),
  });
  const rejected = expect(pending).rejects.toBeDefined();
  await started.promise;
  await queryClient.cancelQueries({ queryKey });
  await rejected;
  expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
  await authSessionStore.replace(B);
  response.resolve(new Response('old data'));
  expect(queryClient.getQueryData(queryKey)).toBeUndefined();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  queryClient.clear();
});

it('rejects an already aborted caller without token or network access', async () => {
  const caller = new AbortController();
  caller.abort();
  const read = jest.spyOn(authSessionStore, 'read');
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  await expect(
    client().request({ input: URL, init: { signal: caller.signal }, parse }),
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(read).not.toHaveBeenCalled();
  expect(fetchMock).not.toHaveBeenCalled();
});

it('rejects missing credentials without trusting a supplied Authorization header', async () => {
  await authSessionStore.clear();
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  await expect(
    client().request({
      input: URL,
      init: { headers: { Authorization: 'fallback' } },
      parse,
    }),
  ).rejects.toThrow('credentials');
  expect(fetchMock).not.toHaveBeenCalled();
});

it('propagates active network, parser and storage errors', async () => {
  const offline = new Error('offline');
  jest
    .spyOn(globalThis, 'fetch')
    .mockRejectedValueOnce(offline)
    .mockResolvedValue(new Response());
  const session = client();
  await expect(session.request({ input: URL, parse })).rejects.toBe(offline);
  const invalid = new Error('invalid body');
  await expect(
    session.request({
      input: URL,
      parse: async () => {
        throw invalid;
      },
    }),
  ).rejects.toBe(invalid);
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(offline);
  await expect(session.request({ input: URL, parse })).rejects.toBe(offline);
});

it('preserves a Request body and headers across a refresh retry', async () => {
  const input = new Request(URL, {
    method: 'POST',
    body: 'original-body',
    headers: { 'X-Custom': 'request-header' },
  });
  const bodies: string[] = [];
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (request) => {
      if (typeof request === 'string')
        return new Response(JSON.stringify(ROTATED));
      bodies.push(await (request as Request).text());
      return bodies.length === 1
        ? new Response('', { status: 401 })
        : new Response('done');
    });
  await expect(client().request({ input, parse })).resolves.toBe('done');
  expect(bodies).toEqual(['original-body', 'original-body']);
  expect(input.bodyUsed).toBe(false);
  expect(input.headers.has('Authorization')).toBe(false);
  expect((fetchMock.mock.calls[2][1]?.headers as Headers).get('X-Custom')).toBe(
    'request-header',
  );
});

it('honors cancellation inherited from Request when init has no signal', async () => {
  const caller = new AbortController();
  const input = new Request(URL, { signal: caller.signal });
  const started = Promise.withResolvers<void>();
  const response = Promise.withResolvers<Response>();
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
    started.resolve();
    return response.promise;
  });
  const pending = client().request({ input, parse });
  const rejected = expect(pending).rejects.toMatchObject({
    name: 'AbortError',
  });
  await started.promise;
  caller.abort();
  await rejected;
  expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
  response.resolve(new Response('ignored'));
});

it('cancels body parsing and detaches session/caller listeners on settlement', async () => {
  const body = Promise.withResolvers<string>();
  const parsing = Promise.withResolvers<void>();
  const caller = new AbortController();
  const session = client();
  const sessionAdded = jest.spyOn(session.signal, 'addEventListener');
  const sessionRemoved = jest.spyOn(session.signal, 'removeEventListener');
  const callerRemoved = jest.spyOn(caller.signal, 'removeEventListener');
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response());
  const pending = session.request({
    input: URL,
    init: { signal: caller.signal },
    parse: () => {
      parsing.resolve();
      return body.promise;
    },
  });
  const rejected = expect(pending).rejects.toMatchObject({
    name: 'AbortError',
  });
  await parsing.promise;
  caller.abort();
  await rejected;
  const listener = sessionAdded.mock.calls[0][1];
  expect(sessionRemoved).toHaveBeenCalledWith('abort', listener);
  expect(callerRemoved).toHaveBeenCalledWith('abort', listener);
  expect(fetchMock.mock.calls[0][1]?.signal?.onabort).toBeNull();
  expect(session.isActive).toBe(true);
  body.resolve('old data');
});

it('does not automatically retry a stale query after account replacement', async () => {
  const started = Promise.withResolvers<void>();
  const response = Promise.withResolvers<Response>();
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
    started.resolve();
    return response.promise;
  });
  const queries = new QueryClient({
    defaultOptions: { queries: { retry: shouldRetryQuery, retryDelay: 0 } },
  });
  const session = client();
  const queryKey = ['personal', 'a'];
  const pending = queries.fetchQuery({
    queryKey,
    queryFn: ({ signal }) =>
      session.request({ input: URL, init: { signal }, parse }),
  });
  const rejected = expect(pending).rejects.toMatchObject({
    name: 'AbortError',
  });
  await started.promise;
  await authSessionStore.replace(B);
  await rejected;
  expect(queries.getQueryData(queryKey)).toBeUndefined();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  response.resolve(new Response('stale'));
  queries.clear();
});
