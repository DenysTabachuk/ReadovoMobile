import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import type { ApplyStreakFreezeRequest, StreakState } from '../../../types';
import { resolveStreakErrorMessage } from '../../utils/resolveStreakErrorMessage';

export async function applyStreakFreeze(
  payload: ApplyStreakFreezeRequest,
): Promise<StreakState> {
  const response = await api
    .post<StreakState>(`/streak/profile/me/freeze`, payload)
    .catch(
      mapHttpError('streak.errors.purchaseFreezeFailed', {
        resolveMessage: (response) =>
          resolveStreakErrorMessage(
            response,
            'streak.errors.purchaseFreezeFailed',
          ),
      }),
    );

  return response.data;
}
