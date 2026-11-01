import {
  type MutationObserverOptions,
  QueryClient,
} from '@tanstack/react-query';

import type { MascotProfile } from '../../../types';
import { clearAllMascotSlots } from '../../requests/clearAllMascotSlots';
import { useClearAllMascotSlotsMutation } from './index';

const mockClient = new QueryClient({
  defaultOptions: { mutations: { retry: false } },
});
let mockUnmount: () => void;

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ currentUser: { id: 'account-a' } }),
}));
jest.mock('../../requests/clearAllMascotSlots', () => ({
  clearAllMascotSlots: jest.fn(),
}));
// Keep the mutation lifecycle real; replace only its React bindings.
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  return {
    ...actual,
    useQueryClient: () => mockClient,
    useMutation: (
      options: MutationObserverOptions<MascotProfile, Error, void>,
    ) => {
      const observer = new actual.MutationObserver(mockClient, options);
      mockUnmount = observer.subscribe(() => undefined);
      return { mutateAsync: observer.mutate.bind(observer) };
    },
  };
});

const PROFILE: MascotProfile = {
  userId: 'account-a',
  ownedItemIds: ['pirate-hat', 'glasses'],
  equippedItems: {},
};

beforeEach(() => {
  jest.resetAllMocks();
  for (const userId of ['account-a', 'account-b']) {
    mockClient.setQueryData(['mascot-profile', userId], {});
    mockClient.setQueryData(['achievements-profile', userId], {});
  }
  jest.mocked(clearAllMascotSlots).mockResolvedValue(PROFILE);
});

afterEach(() => {
  mockUnmount();
  mockClient.clear();
});

it('clears all slots with one request and invalidates only the initiating owner', async () => {
  const mutation = useClearAllMascotSlotsMutation();
  await expect(mutation.mutateAsync()).resolves.toEqual(PROFILE);

  expect(clearAllMascotSlots).toHaveBeenCalledTimes(1);
  for (const query of ['mascot-profile', 'achievements-profile']) {
    expect(mockClient.getQueryState([query, 'account-a'])?.isInvalidated).toBe(
      true,
    );
    expect(mockClient.getQueryState([query, 'account-b'])?.isInvalidated).toBe(
      false,
    );
  }
});

it('keeps cache invalidation after unmount while dropping screen callbacks', async () => {
  const requestStarted = Promise.withResolvers<void>();
  const response = Promise.withResolvers<MascotProfile>();
  jest.mocked(clearAllMascotSlots).mockImplementationOnce(() => {
    requestStarted.resolve();
    return response.promise;
  });
  const mutation = useClearAllMascotSlotsMutation();
  const onSuccess = jest.fn();
  const onSettled = jest.fn();
  const pending = mutation.mutateAsync(undefined, { onSuccess, onSettled });

  await requestStarted.promise;
  mockUnmount();
  response.resolve(PROFILE);
  await pending;

  expect(onSuccess).not.toHaveBeenCalled();
  expect(onSettled).not.toHaveBeenCalled();
  expect(
    mockClient.getQueryState(['mascot-profile', 'account-a'])?.isInvalidated,
  ).toBe(true);
});

it('preserves a failed request without invalidating the profile', async () => {
  const error = new Error('Request failed');
  jest.mocked(clearAllMascotSlots).mockRejectedValueOnce(error);
  const mutation = useClearAllMascotSlotsMutation();

  await expect(mutation.mutateAsync()).rejects.toBe(error);
  expect(
    mockClient.getQueryState(['mascot-profile', 'account-a'])?.isInvalidated,
  ).toBe(false);
});
