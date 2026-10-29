import type { QueryClient } from '@tanstack/react-query';

import { authSessionStore } from '../../../../session/authTokenStorage/authSessionStore';

/**
 * Cancels pending queries and their scheduled retries when login/logout changes
 * the session. Includes public requests, but retains cached data and query keys.
 * Token refresh keeps the session and does not cancel queries. Mutations are not
 * canceled; their request and workflow session guards remain necessary.
 *
 * @param queryClient - The application's existing query client.
 * @returns An unsubscribe function to call when the auth provider unmounts.
 * @example
 * const unsubscribe = cancelQueriesOnSessionChange(queryClient);
 * // A later login/logout cancels pending retries before they can use new tokens.
 * unsubscribe();
 */
export function cancelQueriesOnSessionChange(queryClient: QueryClient) {
  return authSessionStore.subscribe(() => {
    void queryClient.cancelQueries();
  });
}
