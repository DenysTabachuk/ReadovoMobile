import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { ACHIEVEMENT_IDS } from '../constants';
import { type AchievementId } from '../types';

@ApiSchema({ name: 'AchievementProgress' })
export class AchievementProgressDto {
  @ApiProperty({ type: Number })
  declare balance: number;

  @ApiProperty({ type: Number })
  declare lessonsCompleted: number;

  @ApiProperty({ type: Number })
  declare testsCompleted: number;

  @ApiProperty({ type: Number })
  declare wordsLearned: number;
}

@ApiSchema({ name: 'AchievementStatus' })
export class AchievementStatusDto {
  @ApiProperty({ type: String })
  declare badgeKey: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  declare claimedAt: string | null;

  @ApiProperty({ type: Number })
  declare coinsReward: number;

  @ApiProperty({ type: String })
  declare descriptionKey: string;

  @ApiProperty({ type: String, enum: ACHIEVEMENT_IDS })
  declare id: AchievementId;

  @ApiProperty({ type: Boolean })
  declare isClaimed: boolean;

  @ApiProperty({ type: Boolean })
  declare isUnlocked: boolean;

  @ApiProperty({ type: Number })
  declare progressValue: number;

  @ApiProperty({ type: Number })
  declare targetValue: number;

  @ApiProperty({ type: String })
  declare titleKey: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  declare unlockedAt: string | null;
}

/** Serialized profile: both timestamps are present, with null for absent grants. */
@ApiSchema({ name: 'AchievementsProfileResponse' })
export class GetAchievementsProfileResponseDto {
  @ApiProperty({ type: [AchievementStatusDto] })
  declare achievements: AchievementStatusDto[];

  @ApiProperty({ type: AchievementProgressDto })
  declare progress: AchievementProgressDto;

  @ApiProperty({ type: String })
  declare userId: string;
}
