/**
 * Read and log an unsuccessful learning-reminder API response.
 *
 * Consumes the response body with text(); use a cloned Response if another caller must read
 * the same body.
 *
 * @param operation - Operation name to include in diagnostics.
 * @param response - Response whose body is still available to read.
 * @returns A promise resolving after diagnostics are logged; a body-read failure is logged
 *   and does not stop the final error log.
 * @example
 * await logFailedResponse('registerPushToken', new Response('Unavailable', { status: 503 }));
 * // => undefined; logs the response body and status
 */
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
