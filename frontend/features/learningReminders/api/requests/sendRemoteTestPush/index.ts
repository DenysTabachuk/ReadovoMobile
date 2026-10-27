import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import type { SendRemoteTestPushResponse } from '../../types';

export async function sendRemoteTestPush(
  userId: string,
): Promise<SendRemoteTestPushResponse> {
  const response = await api
    .post<SendRemoteTestPushResponse>(`/notifications/test-push/${userId}`, {})
    .catch(mapHttpError('settings.learningReminders.remoteTestFailed'));

  return response.data;
}
