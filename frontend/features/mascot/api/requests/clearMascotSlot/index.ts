import { api } from '@/features/auth';

import type { MascotAccessorySlot, MascotProfile } from '../../../types';

export async function clearMascotSlot(
  slot: MascotAccessorySlot,
): Promise<MascotProfile> {
  const response = await api.delete<MascotProfile>(
    `/mascot/profile/me/slots/${slot}`,
  );

  return response.data;
}
