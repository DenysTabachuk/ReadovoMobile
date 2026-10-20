import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';

import { fetchDictionaryWords } from '../../requests/fetchDictionaryWords';

export function useDictionaryWordsQuery() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  return useQuery({
    enabled: Boolean(userId),
    queryFn: fetchDictionaryWords,
    queryKey: ['dictionary', 'words', userId],
  });
}
