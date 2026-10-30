import { api } from '@/features/auth';

import type { MascotProfile } from '../../../types';

export async function getMascotProfile(): Promise<MascotProfile> {
  const response = await api.get<MascotProfile>(`/mascot/profile/me`);

  return response.data;
}
