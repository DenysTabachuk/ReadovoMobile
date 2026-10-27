import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import type { MascotAccessorySlot, MascotProfile } from '../../../types';
import { resolveMascotErrorMessage } from '../../utils/resolveMascotErrorMessage';

export async function clearMascotSlot(
  userId: string,
  slot: MascotAccessorySlot,
): Promise<MascotProfile> {
  const response = await api
    .delete<MascotProfile>(`/mascot/profile/${userId}/slots/${slot}`)
    .catch(
      mapHttpError('mascot.errors.clearFailed', {
        resolveMessage: (response) =>
          resolveMascotErrorMessage(response, 'mascot.errors.clearFailed'),
      }),
    );

  return response.data;
}
