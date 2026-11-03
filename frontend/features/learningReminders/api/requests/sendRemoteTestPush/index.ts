import { api } from '@/features/auth';

import type { SendTestPushResponse } from '@/api/generated/transport';

export async function sendRemoteTestPush(): Promise<SendTestPushResponse> {
  const response = await api.post<SendTestPushResponse>(
    `/notifications/test-push/me`,
    {},
  );

  return response.data;
}
