import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { StreakState } from '../../../types';

export async function getStreakProfile(): Promise<StreakState> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/streak/profile/me`,
  );

  if (!response.ok) {
    throw new Error('profile.errors.loadFailed');
  }

  return response.json() as Promise<StreakState>;
}
