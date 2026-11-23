import { useQuery } from '@tanstack/react-query';
import { useLearningCatalogueOptions } from '../useLearningCatalogueOptions';

/** Reads the topic's catalogue cover without requesting another catalogue. */
export function useCachedTopicCover(topicSlug: string) {
  const catalogueOptions = useLearningCatalogueOptions();
  const { data } = useQuery({
    ...catalogueOptions(topicSlug),
    enabled: false,
  });
  return data?.topic?.coverImageUrl ?? null;
}
