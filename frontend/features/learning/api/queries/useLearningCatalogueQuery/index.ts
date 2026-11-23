import { useQuery } from '@tanstack/react-query';
import { useLearningCatalogueOptions } from '../useLearningCatalogueOptions';

/**
 * Loads a catalogue for the authenticated user in their preferred language.
 *
 * @param topic - Topic slug. Omit it to load the root catalogue.
 * @returns The catalogue query result, including its loading state and refetch action.
 * @example
 * const { data } = useLearningCatalogueQuery('germany');
 * // data contains the Germany catalogue after the query succeeds.
 */
export function useLearningCatalogueQuery(topic?: string) {
  const options = useLearningCatalogueOptions();
  return useQuery(options(topic));
}
