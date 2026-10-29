import { api } from '@/features/auth';

import type {
  CompleteActivityRequest,
  CompleteActivityResponse,
} from '../../../types';

export async function completeStreakActivity(
  payload: CompleteActivityRequest,
): Promise<CompleteActivityResponse> {
  const response = await api.post<CompleteActivityResponse>(
    `/streak/profile/me/activity-completed`,
    payload,
  );

  return response.data;
}
