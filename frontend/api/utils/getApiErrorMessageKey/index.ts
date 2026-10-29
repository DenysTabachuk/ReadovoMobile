import { HttpError } from '../../httpError';

type ErrorPresentation = { status: number; messageKey: string };
type ErrorMessageOptions = {
  fallbackKey?: string;
  codes?: ReadonlyMap<string, ErrorPresentation>;
};

/**
 * Selects safe localized feedback without reading backend/error message text.
 * @param error - HTTP, transport, cancellation or unexpected failure.
 * @param options - Optional fallback override and feature-owned code/status map.
 * @returns A translation key, or null for silent cancellation. Unknown codes and
 * mismatched statuses use errors.generic unless overridden. No input is changed
 * or translated here.
 * @example
 * getApiErrorMessageKey(new Error('private details'));
 * // => 'errors.generic'
 */
export function getApiErrorMessageKey(
  error: unknown,
  options: ErrorMessageOptions = {},
): string | null {
  if (error instanceof Error) {
    if (error.name === 'AbortError') return null;
    if (error.name === 'NetworkError') return 'errors.network';
    if (error.name === 'TimeoutError') return 'errors.timeout';
  }
  if (error instanceof HttpError) {
    const presentation = error.code
      ? options.codes?.get(error.code)
      : undefined;
    if (presentation?.status === error.status) return presentation.messageKey;
    if (
      error.status === 400 &&
      (error.code === 'VALIDATION_FAILED' || error.code === 'REQUEST_MALFORMED')
    ) {
      return 'errors.invalidRequest';
    }
    if (error.status === 403 && error.code === 'AUTH_OWNERSHIP_DENIED')
      return 'errors.forbidden';
    if (error.status === 413 && error.code === 'REQUEST_TOO_LARGE')
      return 'errors.requestTooLarge';
  }
  return options.fallbackKey ?? 'errors.generic';
}
