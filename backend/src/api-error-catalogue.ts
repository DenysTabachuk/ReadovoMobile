import { ACHIEVEMENTS_ERRORS } from './achievements/achievements-errors';
import { AUTH_ERRORS } from './auth/auth-errors';
import { COMMON_ERRORS } from './common/errors/common-errors';
import { DICTIONARY_ERRORS } from './dictionary/dictionary-errors';
import { MASCOT_ERRORS } from './mascot/mascot-errors';
import { STREAK_ERRORS } from './streak/streak-errors';

/**
 * Application-level catalogue for contract tooling. Definitions stay in their
 * owning modules; request handling does not depend on this aggregate.
 * Keep entries in an array so duplicate public codes cannot silently overwrite
 * one another during a merge. The catalogue test checks their uniqueness.
 */
export const API_ERROR_CATALOGUE = [
  ...Object.values(ACHIEVEMENTS_ERRORS),
  ...Object.values(COMMON_ERRORS),
  ...Object.values(AUTH_ERRORS),
  ...Object.values(STREAK_ERRORS),
  ...Object.values(MASCOT_ERRORS),
  ...Object.values(DICTIONARY_ERRORS),
] as const;
