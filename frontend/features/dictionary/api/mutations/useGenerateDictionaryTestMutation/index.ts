import { useMutation } from '@tanstack/react-query';

import { fetchDictionaryTest } from '../../requests/fetchDictionaryTest';
import type { DictionaryTest } from '../../types';

type UseGenerateDictionaryTestMutationParams = {
  onSuccess: (test: DictionaryTest) => void;
};

/**
 * Generates a test on mutate and passes it to the caller after success.
 * The caller owns displayed test state; mounting does not generate a test.
 *
 * @param params - Callback receiving the generated test for screen state updates.
 * @returns Mutation controls; generation errors remain available to the caller.
 * @example
 * const test = useGenerateDictionaryTestMutation({ onSuccess: setTest });
 * test.mutate(); // Calls setTest after successful generation.
 */
export function useGenerateDictionaryTestMutation({
  onSuccess,
}: UseGenerateDictionaryTestMutationParams) {
  return useMutation({
    mutationFn: fetchDictionaryTest,
    onSuccess,
  });
}
