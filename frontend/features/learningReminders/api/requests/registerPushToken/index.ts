import { api } from '@/features/auth';

import type { RegisterPushTokenPayload } from '../../types';

export async function registerPushToken(
  payload: RegisterPushTokenPayload,
): Promise<void> {
  await api.post(`/notifications/push-token/me`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
