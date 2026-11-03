import { type AchievementStatus } from '@/api/generated/transport';

export type AchievementId = AchievementStatus['id'];

export type {
  AchievementProgress,
  AchievementStatus,
  AchievementsProfileResponse,
} from '@/api/generated/transport';
