import { useMutation } from '@tanstack/react-query';
import { fetchDictionaryTest } from '../../requests/fetchDictionaryTest';

export function useGenerateDictionaryTestMutation() {
  return useMutation({ mutationFn: fetchDictionaryTest });
}
