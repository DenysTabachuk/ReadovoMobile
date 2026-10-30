import { useSavedArticlesQuery } from './index';
import { readSavedArticles } from '../../requests';

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
  readSavedArticles: jest.fn(async () => ({})),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = { id: 'account-a' };
});

it('disables automatic reads when signed out and isolates account cache keys', () => {
  useSavedArticlesQuery();
  expect(mockOptions.queryKey).toEqual([...['savedArticles'], 'account-a']);
  mockCurrentUser = { id: 'account-b' };
  useSavedArticlesQuery();
  expect(mockOptions.queryKey).toEqual([...['savedArticles'], 'account-b']);
  mockCurrentUser = null;
  useSavedArticlesQuery();
  expect(mockOptions.enabled).toBe(false);
  expect(readSavedArticles).not.toHaveBeenCalled();
});

it('sends an owner-free request', async () => {
  useSavedArticlesQuery();
  await mockOptions.queryFn();
  expect(readSavedArticles).toHaveBeenCalledWith();
});
