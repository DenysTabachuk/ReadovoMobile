import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import type { MascotProfile } from '../../../types';
import { resolveMascotErrorMessage } from '../../utils/resolveMascotErrorMessage';

export async function buyMascotItem(
  userId: string,
  itemId: string,
): Promise<MascotProfile> {
  const response = await api
    .post<MascotProfile>(
      `/mascot/profile/${userId}/items/${itemId}/buy`,
      undefined,
    )
    .catch(
      mapHttpError('mascot.errors.buyFailed', {
        resolveMessage: (response) =>
          resolveMascotErrorMessage(response, 'mascot.errors.buyFailed'),
      }),
    );

  return response.data;
}
