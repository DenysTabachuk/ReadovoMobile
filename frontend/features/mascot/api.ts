import { authenticatedFetch } from '@/api/auth/authenticatedFetch';
import { API_BASE_URL } from '@/api/auth/constants';

import { type MascotAccessorySlot, type MascotProfile } from './types';

type ErrorResponseBody = {
  message?: string | string[];
};

export async function getMascotProfile(userId: string): Promise<MascotProfile> {
  const response = await authenticatedFetch(`${API_BASE_URL}/mascot/profile/${userId}`);

  if (!response.ok) {
    throw new Error('mascot.errors.loadFailed');
  }

  return response.json() as Promise<MascotProfile>;
}

export async function buyMascotItem(
  userId: string,
  itemId: string,
): Promise<MascotProfile> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/mascot/profile/${userId}/items/${itemId}/buy`,
    { method: 'POST' },
  );

  if (!response.ok) {
    throw new Error(await resolveMascotErrorMessage(response, 'mascot.errors.buyFailed'));
  }

  return response.json() as Promise<MascotProfile>;
}

export async function equipMascotItem(
  userId: string,
  itemId: string,
): Promise<MascotProfile> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/mascot/profile/${userId}/items/${itemId}/equip`,
    { method: 'POST' },
  );

  if (!response.ok) {
    throw new Error(await resolveMascotErrorMessage(response, 'mascot.errors.equipFailed'));
  }

  return response.json() as Promise<MascotProfile>;
}

export async function clearMascotSlot(
  userId: string,
  slot: MascotAccessorySlot,
): Promise<MascotProfile> {
  const response = await authenticatedFetch(`${API_BASE_URL}/mascot/profile/${userId}/slots/${slot}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await resolveMascotErrorMessage(response, 'mascot.errors.clearFailed'));
  }

  return response.json() as Promise<MascotProfile>;
}

async function resolveMascotErrorMessage(
  response: Response,
  fallbackKey: string,
): Promise<string> {
  try {
    const body = (await response.json()) as ErrorResponseBody;
    const rawMessage = Array.isArray(body.message) ? body.message[0] : body.message;

    if (rawMessage === 'Not enough coins.') {
      return 'mascot.errors.notEnoughCoins';
    }

    if (rawMessage === 'Mascot item is not owned.') {
      return 'mascot.errors.itemNotOwned';
    }
  } catch {
    return fallbackKey;
  }

  return fallbackKey;
}
