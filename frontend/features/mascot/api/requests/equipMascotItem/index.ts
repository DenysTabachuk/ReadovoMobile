import { api } from '@/features/auth';

import type { MascotProfileResponse as MascotProfile } from '@/api/generated/transport';

export async function equipMascotItem(itemId: string): Promise<MascotProfile> {
  const response = await api.post<MascotProfile>(
    `/mascot/profile/me/items/${itemId}/equip`,
    undefined,
  );

  return response.data;
}
