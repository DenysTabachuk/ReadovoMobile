import { dateToDateOnly, isDateOnly } from '../common/database/date-only';
import {
  type Prisma,
  type UserStreakHistory,
  type UserStreakProfile,
} from '../generated/prisma/client';
import {
  type BrokenStreakInfo,
  type StreakHistoryRecord,
  type StreakProfileRecord,
} from './types';

export function mapStreakHistory(row: UserStreakHistory): StreakHistoryRecord {
  return {
    activityDate: dateToDateOnly(row.activityDate),
    status: row.status,
  };
}

export function mapStreakProfile(row: UserStreakProfile): StreakProfileRecord {
  return {
    brokenStreakInfo: parseBrokenStreakInfo(row.brokenStreakInfo),
    currentStreak: row.currentStreak,
    freezeTokens: row.freezeTokens,
    lastActivityDate: row.lastActivityDate
      ? dateToDateOnly(row.lastActivityDate)
      : null,
    longestStreak: row.longestStreak,
    timezone: row.timezone,
  };
}

/**
 * Validates persisted break details and drops fields outside the stored contract.
 * @param value - Database JSON; legacy restorePrice fields are ignored.
 * @returns Break details or null, without mutating input. Invalid details throw.
 * @example
 * parseBrokenStreakInfo({ brokenAt: '2026-10-12', canRestore: true, previousStreak: 6, restorePrice: 100 });
 * // => { brokenAt: '2026-10-12', canRestore: true, previousStreak: 6 }
 */
export function parseBrokenStreakInfo(
  value: Prisma.JsonValue,
): BrokenStreakInfo | null {
  if (value === null) {
    return null;
  }

  if (
    !isJsonObject(value) ||
    typeof value.brokenAt !== 'string' ||
    !isDateOnly(value.brokenAt) ||
    typeof value.canRestore !== 'boolean' ||
    !isNonNegativeInteger(value.previousStreak)
  ) {
    throw new Error('Invalid broken streak information in the database.');
  }

  return {
    brokenAt: value.brokenAt,
    canRestore: value.canRestore,
    previousStreak: value.previousStreak,
  };
}

/**
 * Serializes only the break details owned by persistence, excluding API pricing.
 * @param value - Break details or null; any extra fields are omitted.
 * @returns A fresh Prisma JSON object or null. Does not mutate the input.
 * @example
 * serializeBrokenStreakInfo({ brokenAt: '2026-10-12', canRestore: false, previousStreak: 3 });
 * // => { brokenAt: '2026-10-12', canRestore: false, previousStreak: 3 }
 */
export function serializeBrokenStreakInfo(
  value: BrokenStreakInfo | null,
): Prisma.InputJsonObject | null {
  if (value === null) {
    return null;
  }

  return {
    brokenAt: value.brokenAt,
    canRestore: value.canRestore,
    previousStreak: value.previousStreak,
  };
}

function isJsonObject(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return typeof value === 'object' && !Array.isArray(value);
}

function isNonNegativeInteger(
  value: Prisma.JsonValue | undefined,
): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
