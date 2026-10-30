import { useBuyMascotMutation } from './index';
import { buyMascotItem } from '../../requests';

type Options = {
  mutationFn: (itemId: string) => Promise<unknown>;
  onSuccess: (profile: unknown, value: string) => void;
};
let mockOptions: Options;
const mockInvalidate = jest.fn();
jest.mock('@/features/auth', () => ({
  useAuth: () => ({ currentUser: { id: 'account-a' } }),
}));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
  useMutation: (options: Options) => {
    mockOptions = options;
    return options;
  },
}));
jest.mock('../../requests', () => ({ buyMascotItem: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
});

it('sends resource data only and invalidates the captured account after completion', async () => {
  useBuyMascotMutation({});
  await mockOptions.mutationFn('pirate-hat');
  expect(buyMascotItem).toHaveBeenCalledWith('pirate-hat');
  mockOptions.onSuccess(undefined, 'pirate-hat');
  expect(mockInvalidate).toHaveBeenCalledWith({
    queryKey: ['mascot-profile', 'account-a'],
  });
  expect(mockInvalidate).toHaveBeenCalledWith({
    queryKey: ['achievements-profile', 'account-a'],
  });
});
