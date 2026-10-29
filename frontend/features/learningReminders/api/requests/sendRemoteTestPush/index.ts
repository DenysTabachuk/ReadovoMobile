import { api } from '@/features/auth';

import type { SendRemoteTestPushResponse } from '../../types';

export async function sendRemoteTestPush(
  userId: string,
): Promise<SendRemoteTestPushResponse> {
  const response = await api.post<SendRemoteTestPushResponse>(
    `/notifications/test-push/${userId}`,
    {},
  );

  return response.data;
}
