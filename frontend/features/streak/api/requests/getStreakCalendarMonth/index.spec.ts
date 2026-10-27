import { HttpError } from '@/api/httpError';
import { createHttpResponse } from '@/api/testing/http';
import { api } from '@/features/auth';
import { getStreakCalendarMonth } from '.';

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

describe('getStreakCalendarMonth', () => {
  beforeEach(() => jest.resetAllMocks());

  it('requests the owner and month and preserves the response', async () => {
    const month = {
      year: 2026,
      month: 1,
      days: [],
      monthLabel: 'January 2026',
      serverNow: '2026-01-10T12:00:00Z',
      timezone: 'Europe/Kyiv',
    };
    mockFetch.mockResolvedValue(createHttpResponse(JSON.stringify(month)));
    await expect(
      getStreakCalendarMonth({ year: 2026, month: 1 }),
    ).resolves.toEqual(month);
    expect(mockFetch).toHaveBeenCalledWith(
      '/streak/profile/me/calendar/month?year=2026&month=1',
    );
  });

  it('preserves the existing error key for failed responses', async () => {
    mockFetch.mockRejectedValue(
      new HttpError(createHttpResponse('', { status: 500 })),
    );
    await expect(
      getStreakCalendarMonth({ year: 2026, month: 12 }),
    ).rejects.toThrow('profile.errors.loadFailed');
  });

  it('propagates network failures unchanged', async () => {
    const error = new Error('Offline');
    mockFetch.mockRejectedValue(error);
    await expect(
      getStreakCalendarMonth({ year: 2026, month: 12 }),
    ).rejects.toBe(error);
  });
});
