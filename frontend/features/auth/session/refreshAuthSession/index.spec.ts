import { refreshAuthSession } from '.';
import { authSessionStore } from '../authTokenStorage/authSessionStore';

jest.mock('@/api', () => ({ API_BASE_URL: 'https://api.example.test' }));
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
const ROTATED_B = {
  accessToken: 'rotated-access-B',
  refreshToken: 'rotated-refresh-B',
};

describe('refreshAuthSession', () => {
  beforeEach(async () => {
    await authSessionStore.replace(ACCOUNT_A);
  });
  afterEach(() => jest.restoreAllMocks());

  it('shares concurrent refreshes within one session', async () => {
    const response = Promise.withResolvers<Response>();
    const started = Promise.withResolvers<void>();
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
      started.resolve();
      return response.promise;
    });
    const version = authSessionStore.version;
    const first = refreshAuthSession();
    const second = refreshAuthSession();
    expect(second).toBe(first);
    await started.promise;
    response.resolve(new Response(JSON.stringify(ROTATED_A)));
    await expect(first).resolves.toEqual(ROTATED_A);
    expect(authSessionStore.version).toBe(version);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await authSessionStore.read()).toEqual(ROTATED_A);
  });

  it.each([200, 401])(
    'a late refresh response (%s) cannot replace or clear B tokens',
    async (status) => {
      const response = Promise.withResolvers<Response>();
      const started = Promise.withResolvers<void>();
      jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
        started.resolve();
        return response.promise;
      });
      const refresh = refreshAuthSession();
      await started.promise;
      await authSessionStore.clear();
      await authSessionStore.replace(ACCOUNT_B);
      response.resolve(new Response(JSON.stringify(ROTATED_A), { status }));
      await expect(refresh).resolves.toBeNull();
      expect(await authSessionStore.read()).toEqual(ACCOUNT_B);
    },
  );

  it('does not restore tokens after logout', async () => {
    const response = Promise.withResolvers<Response>();
    const started = Promise.withResolvers<void>();
    jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
      started.resolve();
      return response.promise;
    });
    const refresh = refreshAuthSession();
    await started.promise;
    await authSessionStore.clear();
    response.resolve(new Response(JSON.stringify(ROTATED_A)));
    await expect(refresh).resolves.toBeNull();
    expect(await authSessionStore.read()).toEqual({
      accessToken: null,
      refreshToken: null,
    });
  });

  it('rechecks the session after asynchronous response parsing', async () => {
    const body = Promise.withResolvers<typeof ROTATED_A>();
    const parsing = Promise.withResolvers<void>();
    const response = new Response();
    jest.spyOn(response, 'json').mockImplementation(() => {
      parsing.resolve();
      return body.promise;
    });
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(response);
    const refresh = refreshAuthSession();
    await parsing.promise;
    await authSessionStore.replace(ACCOUNT_B);
    body.resolve(ROTATED_A);
    await expect(refresh).resolves.toBeNull();
    expect(await authSessionStore.read()).toEqual(ACCOUNT_B);
  });

  it('refreshes B independently while the previous account refresh is pending', async () => {
    const oldResponse = Promise.withResolvers<Response>();
    const started = Promise.withResolvers<void>();
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementationOnce(() => {
        started.resolve();
        return oldResponse.promise;
      })
      .mockResolvedValueOnce(new Response(JSON.stringify(ROTATED_B)));
    const oldRefresh = refreshAuthSession();
    await started.promise;
    await authSessionStore.replace(ACCOUNT_B);
    await expect(refreshAuthSession()).resolves.toEqual(ROTATED_B);
    expect(fetchMock.mock.calls[1][1]?.body).toBe(
      '{"refreshToken":"refresh-B"}',
    );
    oldResponse.resolve(new Response(JSON.stringify(ROTATED_A)));
    await expect(oldRefresh).resolves.toBeNull();
    expect(await authSessionStore.read()).toEqual(ROTATED_B);
  });

  it('clears only the initiating session when refresh is denied', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 401 }));
    await expect(refreshAuthSession()).resolves.toBeNull();
    expect(await authSessionStore.read()).toEqual({
      accessToken: null,
      refreshToken: null,
    });
  });

  it('does not call the server without a refresh token', async () => {
    await authSessionStore.clear();
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    await expect(refreshAuthSession()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not refresh a version superseded before execution', async () => {
    const version = authSessionStore.version;
    await authSessionStore.replace(ACCOUNT_B);
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    await expect(refreshAuthSession(version)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('releases a failed refresh so a later request can try again', async () => {
    const offline = new Error('Offline');
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(offline)
      .mockResolvedValueOnce(new Response(JSON.stringify(ROTATED_A)));
    await expect(refreshAuthSession()).rejects.toBe(offline);
    expect(await authSessionStore.read()).toEqual(ACCOUNT_A);
    await expect(refreshAuthSession()).resolves.toEqual(ROTATED_A);
  });
});
