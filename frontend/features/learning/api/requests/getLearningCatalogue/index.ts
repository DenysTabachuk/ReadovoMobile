import { api } from '@/features/auth';
import type { GetLearningCatalogueResponse } from '@/api/generated/transport';
import { isGetLearningCatalogueResponse } from '@/api/generated/learning-validators';

export async function getLearningCatalogue(
  locale: string,
  topic?: string,
): Promise<GetLearningCatalogueResponse> {
  const { data } = await api.get<unknown>('/learning/catalogue', {
    params: { locale, topic },
  });
  if (!isGetLearningCatalogueResponse(data))
    throw new Error('Invalid learning catalogue response.');
  return data;
}
