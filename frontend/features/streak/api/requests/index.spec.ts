import { authenticatedFetch } from '@/features/auth';

import {
  applyStreakFreeze,
  completeStreakActivity,
  getStreakProfile,
  purchaseStreakFreezeToken,
  restoreBrokenStreak,
} from '.';

jest.mock('@/api', () => ({ API_BASE_URL: 'https://api.example.test' }));
jest.mock('@/features/auth', () => ({ authenticatedFetch: jest.fn() }));

const mockFetch = jest.mocked(authenticatedFetch);
const POST_OPTIONS = {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
};

beforeEach(() => jest.resetAllMocks());

it('preserves the current-user profile URL and response', async () => {
  const profile = { currentStreak: 3 };
  mockFetch.mockResolvedValue(new Response(JSON.stringify(profile)));
  await expect(getStreakProfile()).resolves.toEqual(profile);
  expect(mockFetch).toHaveBeenCalledWith(
    'https://api.example.test/streak/profile/me',
  );
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
    mockFetch.mockResolvedValue(new Response(JSON.stringify(result)));
    await expect(request()).resolves.toEqual(result);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.example.test/streak/profile/me/${path}`,
      { ...POST_OPTIONS, body: JSON.stringify(payload) },
    );
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
  mockFetch.mockResolvedValue(new Response('', { status: 500 }));
  await expect(request()).rejects.toThrow('profile.errors.loadFailed');
});

it.each([
  () => restoreBrokenStreak({ price: 10 }),
  () => applyStreakFreeze({ date: '2026-07-08' }),
])(
  'continues resolving known backend errors after relocation',
  async (request) => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Not enough coins.' }), {
        status: 400,
      }),
    );
    await expect(request()).rejects.toThrow('streak.errors.notEnoughCoins');
  },
);
