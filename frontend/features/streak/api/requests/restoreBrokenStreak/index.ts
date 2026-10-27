import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import type { RestoreStreakRequest, StreakState } from '../../../types';
import { resolveStreakErrorMessage } from '../../utils/resolveStreakErrorMessage';

export async function restoreBrokenStreak(
  payload: RestoreStreakRequest,
): Promise<StreakState> {
  const response = await api
    .post<StreakState>(`/streak/profile/me/restore`, payload)
    .catch(
      mapHttpError('streak.errors.freezeFailed', {
        resolveMessage: (response) =>
          resolveStreakErrorMessage(response, 'streak.errors.freezeFailed'),
      }),
    );

  return response.data;
}
