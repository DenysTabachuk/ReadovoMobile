import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';

import { fetchDictionaryWords } from '../../requests/fetchDictionaryWords';

export function dictionaryWordsQueryOptions(userId: string | undefined) {
  return {
    enabled: Boolean(userId),
    queryFn: fetchDictionaryWords,
    queryKey: ['dictionary', 'words', userId],
  };
}

export function useDictionaryWordsQuery() {
  const { currentUser } = useAuth();
  return useQuery(dictionaryWordsQueryOptions(currentUser?.id));
}
