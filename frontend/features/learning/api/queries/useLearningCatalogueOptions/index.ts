import { useAuthenticatedUser } from '@/features/auth';
import { usePreferences } from '@/providers/preferencesProvider';
import { getLearningCatalogue } from '../../requests/getLearningCatalogue';

/**
 * Shares catalogue query settings across single-topic and multi-topic reads.
 *
 * @returns A function that builds query options for a topic or the root catalogue.
 * Cache keys include the authenticated user's ID and preferred language.
 * @example
 * const catalogueOptions = useLearningCatalogueOptions();
 * const germany = useQuery(catalogueOptions('germany'));
 * // The query uses the same cache entry as the multi-topic hook for Germany.
 */
export function useLearningCatalogueOptions() {
  const { id } = useAuthenticatedUser();
  const { languagePreference } = usePreferences();
  return (topic?: string) => ({
    queryKey: ['learning', id, languagePreference, 'catalogue', topic ?? null],
    queryFn: () => getLearningCatalogue(languagePreference, topic),
  });
}
