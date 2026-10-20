const MAX_QUERY_RETRIES = 1;

/**
 * Retries ordinary query failures once, but never retries an aborted operation.
 *
 * @param failureCount - Number of retries already attempted, starting at zero.
 * @param error - Query failure; AbortError identifies an invalidated operation.
 * @returns Whether React Query should attempt the same operation again.
 * @example
 * shouldRetryQuery(0, new Error('Offline')); // => true
 * shouldRetryQuery(1, new Error('Offline')); // => false
 */
export function shouldRetryQuery(failureCount: number, error: Error): boolean {
  return error.name !== 'AbortError' && failureCount < MAX_QUERY_RETRIES;
}
