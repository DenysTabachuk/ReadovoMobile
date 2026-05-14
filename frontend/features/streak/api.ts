import { API_BASE_URL } from '@/api/auth/constants';

import {
  type CompleteActivityRequest,
  type CompleteActivityResponse,
  type RestoreStreakRequest,
  type StreakCalendarMonthResponse,
  type StreakState,
} from './types';

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

