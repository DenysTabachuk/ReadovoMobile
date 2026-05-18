import { API_BASE_URL } from '@/api/auth/constants';

import {
  type ApplyStreakFreezeRequest,
  type CompleteActivityRequest,
  type CompleteActivityResponse,
  type PurchaseStreakFreezeRequest,
  type RestoreStreakRequest,
  type StreakCalendarMonthResponse,
  type StreakState,
} from './types';

type ErrorResponseBody = {
  message?: string | string[];
};

export async function getStreakProfile(userId: string): Promise<StreakState> {
  const response = await fetch(`${API_BASE_URL}/streak/profile/${userId}`);

  if (!response.ok) {
    throw new Error('profile.errors.loadFailed');
  }

  return response.json() as Promise<StreakState>;
}

export async function completeStreakActivity(
  userId: string,
  payload: CompleteActivityRequest,
): Promise<CompleteActivityResponse> {
  const response = await fetch(`${API_BASE_URL}/streak/profile/${userId}/activity-completed`, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('profile.errors.loadFailed');
  }

  return response.json() as Promise<CompleteActivityResponse>;
}

export async function restoreBrokenStreak(
  userId: string,
  payload: RestoreStreakRequest,
): Promise<StreakState> {
  const response = await fetch(`${API_BASE_URL}/streak/profile/${userId}/restore`, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await resolveStreakErrorMessage(response, 'streak.errors.freezeFailed'));
  }

  return response.json() as Promise<StreakState>;
}

export async function applyStreakFreeze(
  userId: string,
  payload: ApplyStreakFreezeRequest,
): Promise<StreakState> {
  const response = await fetch(`${API_BASE_URL}/streak/profile/${userId}/freeze`, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await resolveStreakErrorMessage(response, 'streak.errors.purchaseFreezeFailed'));
  }

  return response.json() as Promise<StreakState>;
}

export async function purchaseStreakFreezeToken(
  userId: string,
  payload: PurchaseStreakFreezeRequest,
): Promise<StreakState> {
  const response = await fetch(`${API_BASE_URL}/streak/profile/${userId}/freeze-token/purchase`, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('profile.errors.loadFailed');
  }

  return response.json() as Promise<StreakState>;
}

export async function getStreakCalendarMonth(
  userId: string,
  year: number,
  month: number,
): Promise<StreakCalendarMonthResponse> {
  const response = await fetch(
    `${API_BASE_URL}/streak/profile/${userId}/calendar/month?year=${year}&month=${month}`,
  );

  if (!response.ok) {
    throw new Error('profile.errors.loadFailed');
  }

  return response.json() as Promise<StreakCalendarMonthResponse>;
}

async function resolveStreakErrorMessage(
  response: Response,
  fallbackKey: string,
): Promise<string> {
  try {
    const body = (await response.json()) as ErrorResponseBody;
    const rawMessage = Array.isArray(body.message) ? body.message[0] : body.message;

    if (rawMessage === 'Not enough coins.') {
      return 'streak.errors.notEnoughCoins';
    }

    if (rawMessage === 'Freeze token limit reached.') {
      return 'streak.errors.freezeLimitReached';
    }

    if (rawMessage === 'Freeze day limit reached.') {
      return 'streak.errors.freezeDayLimitReached';
    }

    if (rawMessage === 'No freeze tokens available.') {
      return 'streak.errors.noFreezeTokens';
    }

    if (
      rawMessage === 'Freeze is only available for recently missed days.' ||
      rawMessage === 'Freeze is only available for the last 3 missed days.'
    ) {
      return 'streak.errors.freezeWindowExpired';
    }

    if (rawMessage === 'Freeze can only be applied to a missed day.') {
      return 'streak.errors.freezeOnlyMissed';
    }

    if (rawMessage === 'This day is already protected.') {
      return 'streak.errors.dayAlreadyProtected';
    }
  } catch {
    return fallbackKey;
  }

  return fallbackKey;
}

