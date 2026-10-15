type ErrorResponseBody = {
  message?: string | string[];
};

export async function resolveMascotErrorMessage(
  response: Response,
  fallbackKey: string,
): Promise<string> {
  try {
    const body = (await response.json()) as ErrorResponseBody;
    const rawMessage = Array.isArray(body.message)
      ? body.message[0]
      : body.message;

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
