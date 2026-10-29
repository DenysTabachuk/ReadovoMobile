import { CancelledError, QueryClient } from '@tanstack/react-query';

import { authSessionStore } from '../../../../session/authTokenStorage/authSessionStore';
import { cancelQueriesOnSessionChange } from '.';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
}));

const TOKENS = { accessToken: 'access-A', refreshToken: 'refresh-A' };
const client = new QueryClient();
let unsubscribe: (() => void) | undefined;

beforeEach(async () => {
  await authSessionStore.replace(TOKENS);
  unsubscribe = cancelQueriesOnSessionChange(client);
});

afterEach(() => {
  unsubscribe?.();
  client.clear();
});

it('cancels pending results on logout without discarding reusable cached data', async () => {
  client.setQueryData(['public-articles'], ['article-1']);
  const response = Promise.withResolvers<string>();
  const pending = client.fetchQuery({
    queryKey: ['personal', 'reader-a'],
    queryFn: () => response.promise,
  });
  const rejected = expect(pending).rejects.toBeInstanceOf(CancelledError);

  await authSessionStore.clear();
  await rejected;
  response.resolve('late result');
  await response.promise;

  expect(client.getQueryData(['personal', 'reader-a'])).toBeUndefined();
  expect(client.getQueryData(['public-articles'])).toEqual(['article-1']);
});

it('allows pending work to finish through token rotation', async () => {
  const response = Promise.withResolvers<string>();
  const pending = client.fetchQuery({
    queryKey: ['personal', 'reader-a'],
    queryFn: () => response.promise,
  });

  await authSessionStore.commitRefresh({
    version: authSessionStore.version,
    tokens: { accessToken: 'rotated-A', refreshToken: 'rotated-refresh-A' },
  });
  response.resolve('current result');

  await expect(pending).resolves.toBe('current result');
});

it('stops reacting to session changes after unsubscribe', async () => {
  const response = Promise.withResolvers<string>();
  const pending = client.fetchQuery({
    queryKey: ['public-articles'],
    queryFn: () => response.promise,
  });

  unsubscribe?.();
  await authSessionStore.replace(TOKENS);
  response.resolve('result after provider unmount');

  await expect(pending).resolves.toBe('result after provider unmount');
});
