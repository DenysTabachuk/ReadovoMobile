import AsyncStorage from '@react-native-async-storage/async-storage';
import { pendingActivityEventsStorage } from '.';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

beforeEach(() => jest.resetAllMocks());

it.each([null, 'invalid JSON', '{}'])(
  'returns an empty queue for missing or unreadable storage: %s',
  async (raw) => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(raw);
    await expect(
      pendingActivityEventsStorage.read('reader-a'),
    ).resolves.toEqual([]);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(
      'readovo.streak.pendingActivityEvents:reader-a',
    );
  },
);

it('preserves stored event order and timestamps', async () => {
  const events = [
    { activityType: 'article_quiz_completed', createdAt: '2026-07-09' },
    { activityType: 'lexical_test_completed', createdAt: '2026-07-10' },
  ];
  jest.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(events));
  await expect(pendingActivityEventsStorage.read('reader-a')).resolves.toEqual(
    events,
  );
});

it('writes only the selected owner key without modifying input', async () => {
  const events = [
    {
      activityType: 'article_quiz_completed' as const,
      createdAt: '2026-07-09',
    },
  ];
  await pendingActivityEventsStorage.write('reader-b', events);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    'readovo.streak.pendingActivityEvents:reader-b',
    '[{"activityType":"article_quiz_completed","createdAt":"2026-07-09"}]',
  );
  expect(events).toEqual([
    { activityType: 'article_quiz_completed', createdAt: '2026-07-09' },
  ]);
});

it('propagates storage failures to callers', async () => {
  const error = new Error('Storage failed');
  jest.mocked(AsyncStorage.getItem).mockRejectedValue(error);
  jest.mocked(AsyncStorage.setItem).mockRejectedValue(error);
  await expect(pendingActivityEventsStorage.read('reader-a')).rejects.toBe(
    error,
  );
  await expect(pendingActivityEventsStorage.write('reader-a', [])).rejects.toBe(
    error,
  );
});
