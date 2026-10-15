import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { MascotProfile } from '../../types';
import { resolveMascotErrorMessage } from '../utils/resolveMascotErrorMessage';

export async function equipMascotItem(
  userId: string,
  itemId: string,
): Promise<MascotProfile> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/mascot/profile/${userId}/items/${itemId}/equip`,
    { method: 'POST' },
  );

  if (!response.ok) {
    throw new Error(
      await resolveMascotErrorMessage(response, 'mascot.errors.equipFailed'),
    );
  }

  return response.json() as Promise<MascotProfile>;
}
