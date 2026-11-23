import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedUser } from '@/features/auth';

type LibraryEntry = {
  slug: string;
  topic: string;
  saved: boolean;
  completed: boolean;
};

type LibraryChange = Pick<LibraryEntry, 'slug' | 'topic'> & {
  flag: 'saved' | 'completed';
  value: boolean;
};

function isLibraryEntry(value: unknown): value is LibraryEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'slug' in value &&
    typeof value.slug === 'string' &&
    value.slug.length > 0 &&
    'topic' in value &&
    typeof value.topic === 'string' &&
    value.topic.length > 0 &&
    'saved' in value &&
    typeof value.saved === 'boolean' &&
    'completed' in value &&
    typeof value.completed === 'boolean'
  );
}

async function readLibrary(key: string): Promise<LibraryEntry[]> {
  const stored = await AsyncStorage.getItem(key);
  if (stored === null) return [];
  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every(isLibraryEntry)) {
    throw new Error('Invalid lesson library');
  }
  return parsed;
}

/**
 * Shares this account's device-local lesson library across the catalogue and
 * lesson routes. Writes serialize and read the last committed flags so saving
 * and completing a lesson cannot overwrite each other.
 * @example mutate({ slug: 'oktoberfest', topic: 'germany', flag: 'saved', value: true })
 */
export function useLessonLibrary() {
  const { id } = useAuthenticatedUser();
  const key = `readovo:lesson-library:${id}`;
  const queryKey = ['lesson-library', id];
  const client = useQueryClient();
  const query = useQuery({
    queryKey,
    queryFn: () => readLibrary(key),
    staleTime: Infinity,
  });
  const mutation = useMutation({
    scope: { id: key },
    mutationFn: async ({ slug, topic, flag, value }: LibraryChange) => {
      const entries = await readLibrary(key);
      const previous = entries.find((entry) => entry.slug === slug);
      const updated = {
        saved: false,
        completed: false,
        ...previous,
        slug,
        topic,
        [flag]: value,
      };
      const next = entries.filter((entry) => entry.slug !== slug);
      if (updated.saved || updated.completed) next.unshift(updated);
      await AsyncStorage.setItem(key, JSON.stringify(next));
      return next;
    },
    onMutate: () => client.cancelQueries({ queryKey }),
    onSuccess: (entries) => client.setQueryData(queryKey, entries),
  });

  return { query, mutation };
}
