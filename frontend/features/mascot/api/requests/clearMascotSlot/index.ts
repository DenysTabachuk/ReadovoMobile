import { api } from '@/features/auth';

import type { MascotAccessorySlot, MascotProfile } from '../../../types';

export async function clearMascotSlot(
  userId: string,
  slot: MascotAccessorySlot,
): Promise<MascotProfile> {
  const response = await api.delete<MascotProfile>(
    `/mascot/profile/${userId}/slots/${slot}`,
  );

  return response.data;
}
