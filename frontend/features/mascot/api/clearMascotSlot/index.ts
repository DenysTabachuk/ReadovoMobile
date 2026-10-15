import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { MascotAccessorySlot, MascotProfile } from '../../types';
import { resolveMascotErrorMessage } from '../utils/resolveMascotErrorMessage';

export async function clearMascotSlot(
  userId: string,
  slot: MascotAccessorySlot,
): Promise<MascotProfile> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/mascot/profile/${userId}/slots/${slot}`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    throw new Error(
      await resolveMascotErrorMessage(response, 'mascot.errors.clearFailed'),
    );
  }

  return response.json() as Promise<MascotProfile>;
}
