import { api } from '@/features/auth';

import type {
  PushTokenAcknowledgment,
  RegisterPushTokenRequest,
} from '@/api/generated/transport';

export async function registerPushToken(
  payload: RegisterPushTokenRequest,
): Promise<void> {
  await api.post<PushTokenAcknowledgment>(
    `/notifications/push-token/me`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}
