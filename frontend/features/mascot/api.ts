import { API_BASE_URL } from '@/api/auth/constants';

import { type MascotAccessorySlot, type MascotProfile } from './types';

export async function getMascotProfile(userId: string): Promise<MascotProfile> {
  const response = await fetch(`${API_BASE_URL}/mascot/profile/${userId}`);

  if (!response.ok) {
    throw new Error('mascot.errors.loadFailed');
  }

  return response.json() as Promise<MascotProfile>;
}

export async function buyMascotItem(
  userId: string,
  itemId: string,
): Promise<MascotProfile> {
  const response = await fetch(
    `${API_BASE_URL}/mascot/profile/${userId}/items/${itemId}/buy`,
    { method: 'POST' },
  );

  if (!response.ok) {
    throw new Error('mascot.errors.buyFailed');
  }

  return response.json() as Promise<MascotProfile>;
}

export async function equipMascotItem(
  userId: string,
  itemId: string,
): Promise<MascotProfile> {
  const response = await fetch(
    `${API_BASE_URL}/mascot/profile/${userId}/items/${itemId}/equip`,
    { method: 'POST' },
  );

  if (!response.ok) {
    throw new Error('mascot.errors.equipFailed');
  }

  return response.json() as Promise<MascotProfile>;
}

export async function clearMascotSlot(
  userId: string,
  slot: MascotAccessorySlot,
): Promise<MascotProfile> {
  const response = await fetch(`${API_BASE_URL}/mascot/profile/${userId}/slots/${slot}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('mascot.errors.clearFailed');
  }

  return response.json() as Promise<MascotProfile>;
}
