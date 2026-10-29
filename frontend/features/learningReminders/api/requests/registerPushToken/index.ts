import { api } from '@/features/auth';

import type { RegisterPushTokenPayload } from '../../types';

export async function registerPushToken(
  userId: string,
  payload: RegisterPushTokenPayload,
): Promise<void> {
  await api.post(`/notifications/push-token/${userId}`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
