type ErrorResponseBody = {
  message?: string | string[];
};

export async function resolveStreakErrorMessage(
  response: Response,
  fallbackKey: string,
): Promise<string> {
  try {
    const body = (await response.json()) as ErrorResponseBody;
    const rawMessage = Array.isArray(body.message)
      ? body.message[0]
      : body.message;

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
