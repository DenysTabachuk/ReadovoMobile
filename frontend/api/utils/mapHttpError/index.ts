import { HttpError } from '../../httpError';

type ErrorMapping = {
  statuses?: Partial<Record<number, string>>;
  resolveMessage?: (
    response: HttpError['response'],
  ) => string | Promise<string>;
};

/**
 * Maps rejected HTTP responses to feature-owned translation keys.
 * Network failures, cancellation and session invalidation pass through unchanged.
 * @param fallbackKey - Translation key for otherwise unrecognized HTTP errors.
 * @param mapping - Optional business-specific status or response mapping.
 * @returns A rejection handler; it never converts a failure into a success.
 * @example
 * httpClient.get('/example').catch(mapHttpError('translation.error'));
 * // HTTP failures reject with translation.error; AbortError remains AbortError.
 */
export function mapHttpError(fallbackKey: string, mapping: ErrorMapping = {}) {
  return async (error: unknown): Promise<never> => {
    if (!(error instanceof HttpError)) throw error;
    const message =
      mapping.statuses?.[error.status] ??
      (mapping.resolveMessage
        ? await mapping.resolveMessage(error.response)
        : fallbackKey);
    throw new Error(message);
  };
}
