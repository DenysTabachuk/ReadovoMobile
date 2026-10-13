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
    !isNonNegativeInteger(value.previousStreak) ||
    !isNonNegativeInteger(value.restorePrice)
  ) {
    throw new Error('Invalid broken streak information in the database.');
  }

  return {
    brokenAt: value.brokenAt,
    canRestore: value.canRestore,
    previousStreak: value.previousStreak,
    restorePrice: value.restorePrice,
  };
}

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
    restorePrice: value.restorePrice,
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
