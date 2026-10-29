import { api } from '@/features/auth';

import type { MascotProfile } from '../../../types';

export async function equipMascotItem(
  userId: string,
  itemId: string,
): Promise<MascotProfile> {
  const response = await api.post<MascotProfile>(
    `/mascot/profile/${userId}/items/${itemId}/equip`,
    undefined,
  );

  return response.data;
}
