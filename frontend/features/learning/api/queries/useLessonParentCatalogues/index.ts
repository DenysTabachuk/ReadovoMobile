import { useQueries } from '@tanstack/react-query';
import { useLearningCatalogueOptions } from '../useLearningCatalogueOptions';

/**
 * Loads the parent topic catalogues needed to display lessons from the library.
 *
 * @param topics - Distinct parent topic slugs. An empty list starts no queries.
 * @returns One catalogue query result per topic, in the supplied order.
 * @example
 * const [germany] = useLessonParentCatalogues(['germany']);
 * // germany.data contains that topic catalogue after its query succeeds.
 */
export function useLessonParentCatalogues(topics: string[]) {
  const options = useLearningCatalogueOptions();
  return useQueries({ queries: topics.map(options) });
}
