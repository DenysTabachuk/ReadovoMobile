export async function logFailedResponse(
  operation: string,
  response: Response,
): Promise<void> {
  let body = '';

  try {
    body = await response.text();
  } catch (error) {
    console.error(
      `[LearningRemindersApi] ${operation} failed to read error body`,
      error,
    );
  }

  console.error(`[LearningRemindersApi] ${operation} failed`, {
    body,
    status: response.status,
    statusText: response.statusText,
    url: response.url,
  });
}
