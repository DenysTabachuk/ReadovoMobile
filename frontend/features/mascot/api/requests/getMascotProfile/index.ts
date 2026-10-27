import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import type { MascotProfile } from '../../../types';

export async function getMascotProfile(userId: string): Promise<MascotProfile> {
  const response = await api
    .get<MascotProfile>(`/mascot/profile/${userId}`)
    .catch(mapHttpError('mascot.errors.loadFailed'));

  return response.data;
}
