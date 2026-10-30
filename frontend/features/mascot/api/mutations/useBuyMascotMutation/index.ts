import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { buyMascotItem } from '../../requests';
import type { MascotProfile } from '../../../types';

type UseBuyMascotMutationParams = {
  onSuccess?: (profile: MascotProfile, itemId: string) => void;
  onError?: (error: Error) => void;
};

/**
 * Applies an authenticated mascot change and refreshes this account's profile and balance.
 * @param params - Screen callbacks.
 * @returns Mutation controls that refresh the account data after success.
 * @example
 * const change = useBuyMascotMutation({});
 * change.mutate('pirate-hat'); // Refreshes account data after completion.
 */
export function useBuyMascotMutation({
  onSuccess,
  onError,
}: UseBuyMascotMutationParams) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => buyMascotItem(itemId),
    onError,
    onSuccess: (profile, itemId) => {
      void queryClient.invalidateQueries({
        queryKey: ['mascot-profile', currentUser?.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['achievements-profile', currentUser?.id],
      });
      onSuccess?.(profile, itemId);
    },
  });
}
