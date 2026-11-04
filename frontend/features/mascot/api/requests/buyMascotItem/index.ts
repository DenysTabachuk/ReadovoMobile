import { api } from '@/features/auth';

import type { MascotProfileResponse as MascotProfile } from '@/api/generated/transport';

export async function buyMascotItem(itemId: string): Promise<MascotProfile> {
  const response = await api.post<MascotProfile>(
    `/mascot/profile/me/items/${itemId}/buy`,
    undefined,
  );

  return response.data;
}
