import { useAchievementsProfileQuery } from './index';
import { getAchievementsProfile } from '../../requests';

type QueryOptions = {
  enabled: boolean;
  queryKey: readonly unknown[];
  queryFn: () => Promise<unknown>;
};
let mockOptions: QueryOptions;
let mockCurrentUser: { id: string } | null;
jest.mock('@/features/auth', () => ({
  useAuth: () => ({ currentUser: mockCurrentUser }),
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: (options: QueryOptions) => {
    mockOptions = options;
    return options;
  },
}));
jest.mock('../../requests', () => ({
  getAchievementsProfile: jest.fn(async () => ({})),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = { id: 'account-a' };
});

it('disables automatic reads when signed out and isolates account cache keys', () => {
  useAchievementsProfileQuery();
  expect(mockOptions.queryKey).toEqual([
    ...['achievements-profile'],
    'account-a',
  ]);
  mockCurrentUser = { id: 'account-b' };
  useAchievementsProfileQuery();
  expect(mockOptions.queryKey).toEqual([
    ...['achievements-profile'],
    'account-b',
  ]);
  mockCurrentUser = null;
  useAchievementsProfileQuery();
  expect(mockOptions.enabled).toBe(false);
  expect(getAchievementsProfile).not.toHaveBeenCalled();
});

it('sends an owner-free request', async () => {
  useAchievementsProfileQuery();
  await mockOptions.queryFn();
  expect(getAchievementsProfile).toHaveBeenCalledWith();
});
