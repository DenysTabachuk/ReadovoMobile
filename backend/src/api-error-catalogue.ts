import { AUTH_ERRORS } from './auth/auth-errors';
import { COMMON_ERRORS } from './common/errors/common-errors';

/**
 * Application-level catalogue for contract tooling. Definitions stay in their
 * owning modules; request handling does not depend on this aggregate.
 * Keep entries in an array so duplicate public codes cannot silently overwrite
 * one another during a merge. The catalogue test checks their uniqueness.
 */
export const API_ERROR_CATALOGUE = [
  ...Object.values(COMMON_ERRORS),
  ...Object.values(AUTH_ERRORS),
] as const;
