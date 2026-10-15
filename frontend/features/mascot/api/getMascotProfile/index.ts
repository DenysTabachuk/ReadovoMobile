import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { MascotProfile } from '../../types';

export async function getMascotProfile(userId: string): Promise<MascotProfile> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/mascot/profile/${userId}`,
  );

  if (!response.ok) {
    throw new Error('mascot.errors.loadFailed');
  }

  return response.json() as Promise<MascotProfile>;
}
