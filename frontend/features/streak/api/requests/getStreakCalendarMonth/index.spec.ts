import { authenticatedFetch } from '@/features/auth';
import { getStreakCalendarMonth } from '.';

jest.mock('@/api', () => ({ API_BASE_URL: 'https://api.example.test' }));
jest.mock('@/features/auth', () => ({ authenticatedFetch: jest.fn() }));

const mockFetch = jest.mocked(authenticatedFetch);

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
    mockFetch.mockResolvedValue(new Response(JSON.stringify(month)));
    await expect(
      getStreakCalendarMonth({ year: 2026, month: 1 }),
    ).resolves.toEqual(month);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.test/streak/profile/me/calendar/month?year=2026&month=1',
    );
  });

  it('preserves the existing error key for failed responses', async () => {
    mockFetch.mockResolvedValue(new Response('', { status: 500 }));
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
