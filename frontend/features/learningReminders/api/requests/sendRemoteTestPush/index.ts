import { api } from '@/features/auth';

import type { SendRemoteTestPushResponse } from '../../types';

export async function sendRemoteTestPush(): Promise<SendRemoteTestPushResponse> {
  const response = await api.post<SendRemoteTestPushResponse>(
    `/notifications/test-push/me`,
    {},
  );

  return response.data;
}
