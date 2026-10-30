import { api } from '@/features/auth';

import type { MascotProfile } from '../../../types';

export async function buyMascotItem(itemId: string): Promise<MascotProfile> {
  const response = await api.post<MascotProfile>(
    `/mascot/profile/me/items/${itemId}/buy`,
    undefined,
  );

  return response.data;
}
