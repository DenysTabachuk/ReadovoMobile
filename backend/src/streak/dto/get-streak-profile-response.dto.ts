import {
  ApiExtraModels,
  ApiProperty,
  ApiSchema,
  getSchemaPath,
} from '@nestjs/swagger';

import {
  STREAK_ACHIEVEMENT_MILESTONES,
  STREAK_DAY_STATUSES,
  STREAK_TODAY_STATUSES,
} from '../constants';
import {
  type StreakAchievementMilestone,
  type StreakDayStatus,
  type StreakTodayStatus,
} from '../types';

@ApiSchema({ name: 'StreakHistoryDay' })
export class StreakHistoryDayDto {
  @ApiProperty({ type: String, format: 'date' })
  declare date: string;

  @ApiProperty({ enum: STREAK_DAY_STATUSES, enumName: 'StreakDayStatus' })
  declare status: StreakDayStatus;
}

@ApiSchema({ name: 'BrokenStreakInfo' })
export class BrokenStreakInfoDto {
  @ApiProperty({ type: String, format: 'date' })
  declare brokenAt: string;

  @ApiProperty({ type: Boolean })
  declare canRestore: boolean;

  @ApiProperty({ type: Number })
  declare previousStreak: number;
}

@ApiSchema({ name: 'StreakAchievement' })
export class StreakAchievementDto {
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  declare claimedAt: string | null;

  @ApiProperty({ type: Boolean })
  declare isUnlocked: boolean;

  @ApiProperty({
    enum: STREAK_ACHIEVEMENT_MILESTONES,
    enumName: 'StreakAchievementMilestone',
  })
  declare milestone: StreakAchievementMilestone;

  @ApiProperty({ type: Number })
  declare rewardCoins: number;
}

/** Shared serialized state returned by profile reads and all streak mutations. */
@ApiExtraModels(BrokenStreakInfoDto)
@ApiSchema({ name: 'StreakState' })
export class GetStreakProfileResponseDto {
  @ApiProperty({ type: [StreakHistoryDayDto] })
  declare activityHistory: StreakHistoryDayDto[];

  // A nullable reference needs an explicit union in OpenAPI 3.0. Merely adding
  // nullable beside $ref does not make the referenced object's schema nullable.
  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(BrokenStreakInfoDto) },
      { type: 'object', nullable: true, enum: [null] },
    ],
  })
  declare brokenStreakInfo: BrokenStreakInfoDto | null;

  @ApiProperty({ type: [StreakAchievementDto] })
  declare claimedStreakAchievements: StreakAchievementDto[];

  @ApiProperty({ type: Number })
  declare coinBalance: number;

  @ApiProperty({ type: Number })
  declare currentStreak: number;

  @ApiProperty({ type: Number })
  declare freezeTokenPrice: number;

  @ApiProperty({ type: Number })
  declare freezeTokens: number;

  @ApiProperty({ type: String, format: 'date', nullable: true })
  declare lastActivityDate: string | null;

  @ApiProperty({ type: Number })
  declare longestStreak: number;

  @ApiProperty({ type: Number })
  declare nextBonusInDays: number;

  @ApiProperty({
    enum: STREAK_ACHIEVEMENT_MILESTONES,
    enumName: 'StreakAchievementMilestone',
  })
  declare nextMilestone: StreakAchievementMilestone;

  @ApiProperty({ type: Number })
  declare restorePrice: number;

  @ApiProperty({ type: String, format: 'date-time' })
  declare serverNow: string;

  @ApiProperty({ enum: STREAK_TODAY_STATUSES, enumName: 'StreakTodayStatus' })
  declare todayStatus: StreakTodayStatus;
}
