import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import type { MascotProfile } from '../../../types';
import { resolveMascotErrorMessage } from '../../utils/resolveMascotErrorMessage';

export async function equipMascotItem(
  userId: string,
  itemId: string,
): Promise<MascotProfile> {
  const response = await api
    .post<MascotProfile>(
      `/mascot/profile/${userId}/items/${itemId}/equip`,
      undefined,
    )
    .catch(
      mapHttpError('mascot.errors.equipFailed', {
        resolveMessage: (response) =>
          resolveMascotErrorMessage(response, 'mascot.errors.equipFailed'),
      }),
    );

  return response.data;
}
