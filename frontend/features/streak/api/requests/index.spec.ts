import { HttpError } from '@/api/httpError';
import { createHttpResponse } from '@/api/testing/http';
import { api } from '@/features/auth';

import {
  applyStreakFreeze,
  completeStreakActivity,
  getStreakProfile,
  purchaseStreakFreezeToken,
  restoreBrokenStreak,
} from '.';

jest.mock('@/api', () => ({ API_BASE_URL: 'https://api.example.test' }));
jest.mock('@/features/auth', () => {
  const request = jest.fn();
  const withBody =
    (method: string) =>
    (url: string, data: unknown, config?: Record<string, unknown>) =>
      request(url, { ...config, method, data });
  return {
    api: Object.assign(request, {
      get: (url: string, config?: Record<string, unknown>) =>
        config ? request(url, config) : request(url),
      delete: (url: string, config?: Record<string, unknown>) =>
        request(url, { ...config, method: 'DELETE' }),
      post: withBody('POST'),
      put: withBody('PUT'),
      patch: withBody('PATCH'),
    }),
  };
});

const mockFetch = jest.mocked(api);
const POST_OPTIONS = {
  method: 'POST',
};

beforeEach(() => jest.resetAllMocks());

it('preserves the current-user profile URL and response', async () => {
  const profile = { currentStreak: 3 };
  mockFetch.mockResolvedValue(createHttpResponse(JSON.stringify(profile)));
  await expect(getStreakProfile()).resolves.toEqual(profile);
  expect(mockFetch).toHaveBeenCalledWith('/streak/profile/me');
});

it.each([
  {
    path: 'activity-completed',
    payload: { activityType: 'article_quiz_completed' as const },
    request: () =>
      completeStreakActivity({
        activityType: 'article_quiz_completed',
      }),
    result: { streak: { currentStreak: 3 }, pendingSync: false },
  },
  {
    path: 'restore',
    payload: { price: 10 },
    request: () => restoreBrokenStreak({ price: 10 }),
    result: { currentStreak: 3 },
  },
  {
    path: 'freeze',
    payload: { date: '2026-07-08' },
    request: () => applyStreakFreeze({ date: '2026-07-08' }),
    result: { freezeTokens: 0 },
  },
  {
    path: 'freeze-token/purchase',
    payload: { price: 5 },
    request: () => purchaseStreakFreezeToken({ price: 5 }),
    result: { freezeTokens: 1 },
  },
])(
  'preserves the $path request and response after relocation',
  async ({ path, payload, request, result }) => {
    mockFetch.mockResolvedValue(createHttpResponse(JSON.stringify(result)));
    await expect(request()).resolves.toEqual(result);
    expect(mockFetch).toHaveBeenCalledWith(`/streak/profile/me/${path}`, {
      ...POST_OPTIONS,
      data: payload,
    });
  },
);

it.each([
  () => getStreakProfile(),
  () =>
    completeStreakActivity({
      activityType: 'article_quiz_completed',
    }),
  () => purchaseStreakFreezeToken({ price: 5 }),
])('preserves generic request failures', async (request) => {
  mockFetch.mockRejectedValue(
    new HttpError(createHttpResponse('', { status: 500 })),
  );
  await expect(request()).rejects.toMatchObject({ status: 500 });
});

it.each([
  () => restoreBrokenStreak({ price: 10 }),
  () => applyStreakFreeze({ date: '2026-07-08' }),
])(
  'preserves domain codes without translating them in requests',
  async (request) => {
    mockFetch.mockRejectedValue(
      new HttpError(
        createHttpResponse(
          { code: 'STREAK_NOT_ENOUGH_COINS', message: 'Changed wording' },
          {
            status: 400,
          },
        ),
      ),
    );
    await expect(request()).rejects.toMatchObject({
      status: 400,
      code: 'STREAK_NOT_ENOUGH_COINS',
    });
  },
);
