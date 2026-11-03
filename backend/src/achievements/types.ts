import { ACHIEVEMENT_IDS } from './constants';

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

export type {
  AchievementProgressDto as UserProgress,
  AchievementStatusDto as AchievementStatus,
  GetAchievementsProfileResponseDto as AchievementsProfileResponse,
} from './dto/get-achievements-profile-response.dto';
