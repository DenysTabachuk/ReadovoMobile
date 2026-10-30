import { useMascotProfileQuery } from './index';
import { getMascotProfile } from '../../requests';

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
  getMascotProfile: jest.fn(async () => ({})),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = { id: 'account-a' };
});

it('disables automatic reads when signed out and isolates account cache keys', () => {
  useMascotProfileQuery();
  expect(mockOptions.queryKey).toEqual([...['mascot-profile'], 'account-a']);
  mockCurrentUser = { id: 'account-b' };
  useMascotProfileQuery();
  expect(mockOptions.queryKey).toEqual([...['mascot-profile'], 'account-b']);
  mockCurrentUser = null;
  useMascotProfileQuery();
  expect(mockOptions.enabled).toBe(false);
  expect(getMascotProfile).not.toHaveBeenCalled();
});

it('sends an owner-free request', async () => {
  useMascotProfileQuery();
  await mockOptions.queryFn();
  expect(getMascotProfile).toHaveBeenCalledWith();
});
