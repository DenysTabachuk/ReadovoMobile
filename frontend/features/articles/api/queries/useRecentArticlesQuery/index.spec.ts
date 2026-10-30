import { useRecentArticlesQuery } from './index';
import { readRecentArticles } from '../../requests';

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
  readRecentArticles: jest.fn(async () => ({})),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = { id: 'account-a' };
});

it('disables automatic reads when signed out and isolates account cache keys', () => {
  useRecentArticlesQuery();
  expect(mockOptions.queryKey).toEqual([...['recentArticles'], 'account-a']);
  mockCurrentUser = { id: 'account-b' };
  useRecentArticlesQuery();
  expect(mockOptions.queryKey).toEqual([...['recentArticles'], 'account-b']);
  mockCurrentUser = null;
  useRecentArticlesQuery();
  expect(mockOptions.enabled).toBe(false);
  expect(readRecentArticles).not.toHaveBeenCalled();
});

it('sends an owner-free request', async () => {
  useRecentArticlesQuery();
  await mockOptions.queryFn();
  expect(readRecentArticles).toHaveBeenCalledWith();
});
