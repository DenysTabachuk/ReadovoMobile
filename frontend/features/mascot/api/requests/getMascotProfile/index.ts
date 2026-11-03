import { api } from '@/features/auth';

import type { MascotProfileResponse as MascotProfile } from '@/api/generated/transport';

export async function getMascotProfile(): Promise<MascotProfile> {
  const response = await api.get<MascotProfile>(`/mascot/profile/me`);

  return response.data;
}
