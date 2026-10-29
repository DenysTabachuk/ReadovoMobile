import { api } from '@/features/auth';

import type { MascotProfile } from '../../../types';

export async function getMascotProfile(userId: string): Promise<MascotProfile> {
  const response = await api.get<MascotProfile>(`/mascot/profile/${userId}`);

  return response.data;
}
