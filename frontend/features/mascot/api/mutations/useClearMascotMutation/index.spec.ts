import { useClearMascotMutation } from './index';
import { clearMascotSlot } from '../../requests';
import type { MascotAccessorySlot } from '../../../types';

type Options = {
  mutationFn: (slot: MascotAccessorySlot) => Promise<unknown>;
  onSuccess: (profile: unknown, value: MascotAccessorySlot) => void;
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
jest.mock('../../requests', () => ({ clearMascotSlot: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
});

it('sends resource data only and invalidates the captured account after completion', async () => {
  useClearMascotMutation({});
  await mockOptions.mutationFn('head');
  expect(clearMascotSlot).toHaveBeenCalledWith('head');
  mockOptions.onSuccess(undefined, 'head');
  expect(mockInvalidate).toHaveBeenCalledWith({
    queryKey: ['mascot-profile', 'account-a'],
  });
  expect(mockInvalidate).toHaveBeenCalledWith({
    queryKey: ['achievements-profile', 'account-a'],
  });
});
