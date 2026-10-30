import { useClearAllMascotSlotsMutation } from './index';
import { clearMascotSlot } from '../../requests';

type Options = {
  mutationFn: (slots: void) => Promise<unknown>;
  onSuccess: (profile: unknown, value: void) => void;
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
  useClearAllMascotSlotsMutation({ slots: ['head', 'eyes'] });
  await mockOptions.mutationFn();
  expect(clearMascotSlot).toHaveBeenNthCalledWith(1, 'head');
  expect(clearMascotSlot).toHaveBeenNthCalledWith(2, 'eyes');
  mockOptions.onSuccess(undefined, undefined);
  expect(mockInvalidate).toHaveBeenCalledWith({
    queryKey: ['mascot-profile', 'account-a'],
  });
  expect(mockInvalidate).toHaveBeenCalledWith({
    queryKey: ['achievements-profile', 'account-a'],
  });
});
