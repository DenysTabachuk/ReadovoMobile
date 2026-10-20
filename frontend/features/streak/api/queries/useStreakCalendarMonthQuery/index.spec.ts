import {
  QueryClient,
  type QueryObserver,
  type QueryObserverOptions,
} from '@tanstack/react-query';
import { getStreakCalendarMonth } from '../../requests/getStreakCalendarMonth';
import type { StreakCalendarMonthResponse } from '../../../types';
import { useStreakCalendarMonthQuery } from '.';

const mockClient = new QueryClient();
const mockRequest = jest.mocked(getStreakCalendarMonth);
let mockUserId: string | undefined = 'reader-1';
let mockObserver: QueryObserver<StreakCalendarMonthResponse>;
const JULY: StreakCalendarMonthResponse = {
  days: [],
  month: 7,
  monthLabel: 'July 2026',
  year: 2026,
  serverNow: '2026-07-10T12:00:00Z',
  timezone: 'Europe/Kyiv',
};

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ currentUser: mockUserId ? { id: mockUserId } : null }),
}));
jest.mock('../../requests/getStreakCalendarMonth', () => ({
  getStreakCalendarMonth: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  return {
    ...actual,
    useQuery: (options: QueryObserverOptions<StreakCalendarMonthResponse>) => {
      mockObserver = new actual.QueryObserver(mockClient, options);
      return {
        ...mockObserver.getCurrentResult(),
        refetch: mockObserver.refetch.bind(mockObserver),
      };
    },
  };
});

describe('useStreakCalendarMonthQuery', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUserId = 'reader-1';
  });
  afterEach(() => mockClient.clear());

  it('requests the selected month and caches the response under the existing key', async () => {
    mockRequest.mockResolvedValue(JULY);
    const query = useStreakCalendarMonthQuery({
      year: 2026,
      month: 7,
    });
    expect((await query.refetch()).data).toBe(JULY);
    expect(mockRequest).toHaveBeenCalledWith({
      year: 2026,
      month: 7,
    });
    expect(
      mockClient.getQueryData(['streak-calendar-month', 'reader-1', 2026, 7]),
    ).toBe(JULY);
  });

  it('does not automatically fetch without a user', () => {
    mockUserId = undefined;
    useStreakCalendarMonthQuery({ year: 2026, month: 7 });
    const unsubscribe = mockObserver.subscribe(() => undefined);
    expect(mockRequest).not.toHaveBeenCalled();
    expect(mockObserver.getCurrentResult().fetchStatus).toBe('idle');
    unsubscribe();
  });

  it('isolates months and owners while retaining owner-wide invalidation', async () => {
    mockRequest.mockResolvedValue(JULY);
    await useStreakCalendarMonthQuery({
      year: 2026,
      month: 7,
    }).refetch();
    const august = { ...JULY, month: 8, monthLabel: 'August 2026' };
    mockRequest.mockResolvedValue(august);
    await useStreakCalendarMonthQuery({
      year: 2026,
      month: 8,
    }).refetch();
    mockUserId = 'reader-2';
    await useStreakCalendarMonthQuery({
      year: 2026,
      month: 8,
    }).refetch();
    expect(
      mockClient.getQueryData(['streak-calendar-month', 'reader-1', 2026, 7]),
    ).toBe(JULY);
    expect(
      mockClient.getQueryData(['streak-calendar-month', 'reader-1', 2026, 8]),
    ).toBe(august);
    await mockClient.invalidateQueries({
      queryKey: ['streak-calendar-month', 'reader-1'],
    });
    expect(
      mockClient.getQueryState(['streak-calendar-month', 'reader-1', 2026, 7])
        ?.isInvalidated,
    ).toBe(true);
    expect(
      mockClient.getQueryState(['streak-calendar-month', 'reader-1', 2026, 8])
        ?.isInvalidated,
    ).toBe(true);
    expect(
      mockClient.getQueryState(['streak-calendar-month', 'reader-2', 2026, 8])
        ?.isInvalidated,
    ).toBe(false);
  });
});
