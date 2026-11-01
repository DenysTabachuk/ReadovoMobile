import { api } from '@/features/auth';

import type { MascotProfile } from '../../../types';

export async function clearAllMascotSlots(): Promise<MascotProfile> {
  const response = await api.delete<MascotProfile>('/mascot/profile/me/slots');
  return response.data;
}
