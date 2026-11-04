import { api } from '@/features/auth';

import type { MascotProfileResponse as MascotProfile } from '@/api/generated/transport';

export async function clearAllMascotSlots(): Promise<MascotProfile> {
  const response = await api.delete<MascotProfile>('/mascot/profile/me/slots');
  return response.data;
}
