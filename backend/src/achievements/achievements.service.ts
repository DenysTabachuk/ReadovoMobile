import { Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { achievementDefinitions } from './definitions';
import {
  type AchievementId,
  type AchievementStatus,
  type AchievementsProfileResponse,
  type UpdateProgressDto,
  type UserProgress,
} from './types';

type UserProgressRow = {
  balance: number;
  lessons_completed: number;
  tests_completed: number;
  words_learned: number;
};

type UserAchievementRow = {
  achievement_id: AchievementId;
  claimed_at: Date | null;
  unlocked_at: Date;
};

@Injectable()
export class AchievementsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getProfile(userId: string): Promise<AchievementsProfileResponse> {
    const progress = await this.getUserProgress(userId);
    const unlockedRows = await this.getUnlockedRows(userId);

    await this.persistNewUnlocks(userId, progress, unlockedRows);

    const refreshedUnlockedRows = await this.getUnlockedRows(userId);
    const unlockedMap = new Map(
      refreshedUnlockedRows.map((row) => [row.achievement_id, row]),
    );

    const achievements: AchievementStatus[] = achievementDefinitions.map((definition) => {
      const unlocked = unlockedMap.get(definition.id);
      return {
        badgeKey: definition.badgeKey,
        claimedAt: unlocked?.claimed_at?.toISOString() ?? null,
        coinsReward: definition.coinsReward,
        descriptionKey: definition.descriptionKey,
        id: definition.id,
        isClaimed: Boolean(unlocked?.claimed_at),
        isUnlocked: Boolean(unlocked),
        progressValue: definition.getProgressValue(progress),
        targetValue: definition.targetValue,
        titleKey: definition.titleKey,
        unlockedAt: unlocked?.unlocked_at?.toISOString() ?? null,
      };
    });

    return {
      achievements,
      progress,
      userId,
    };
  }

  async updateProgress(
    userId: string,
    update: UpdateProgressDto,
  ): Promise<AchievementsProfileResponse> {
    const current = await this.getUserProgress(userId);

    const next: UserProgress = {
      balance: this.resolveProgressValue(update.balance, current.balance),
      lessonsCompleted: this.resolveProgressValue(
        update.lessonsCompleted,
        current.lessonsCompleted,
      ),
      testsCompleted: this.resolveProgressValue(
        update.testsCompleted,
        current.testsCompleted,
      ),
      wordsLearned: this.resolveProgressValue(
        update.wordsLearned,
        current.wordsLearned,
      ),
    };

    await this.databaseService.query(
      `
        UPDATE users
        SET lessons_completed = $2,
            tests_completed = $3,
            words_learned = $4,
            balance = $5
        WHERE id = $1
      `,
      [
        userId,
        next.lessonsCompleted,
        next.testsCompleted,
        next.wordsLearned,
        next.balance,
      ],
    );

    return this.getProfile(userId);
  }

  private async getUserProgress(userId: string): Promise<UserProgress> {
    const [userResult, learnedWordsResult] = await Promise.all([
      this.databaseService.query<UserProgressRow>(
      `
        SELECT lessons_completed, tests_completed, words_learned, balance
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId],
      ),
      this.databaseService.query<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM dictionary_words
          WHERE progress = 'learned'
        `,
      ),
    ]);

    const row = userResult.rows[0];

    if (!row) {
      throw new NotFoundException('User not found.');
    }

    return {
      balance: row.balance,
      lessonsCompleted: row.lessons_completed,
      testsCompleted: row.tests_completed,
      wordsLearned: Number(learnedWordsResult.rows[0]?.count ?? 0),
    };
  }

  private async getUnlockedRows(userId: string): Promise<UserAchievementRow[]> {
    const result = await this.databaseService.query<UserAchievementRow>(
      `
        SELECT achievement_id, unlocked_at, claimed_at
        FROM user_achievements
        WHERE user_id = $1
      `,
      [userId],
    );

    return result.rows;
  }

  private async persistNewUnlocks(
    userId: string,
    progress: UserProgress,
    unlockedRows: UserAchievementRow[],
  ): Promise<void> {
    const unlockedIds = new Set(unlockedRows.map((row) => row.achievement_id));
    const newUnlockIds = achievementDefinitions
      .filter((definition) => definition.isUnlocked(progress) && !unlockedIds.has(definition.id))
      .map((definition) => definition.id);

    if (newUnlockIds.length === 0) {
      return;
    }

    await Promise.all(
      newUnlockIds.map((achievementId) =>
        this.databaseService.query(
          `
            INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
            VALUES ($1, $2, now())
            ON CONFLICT (user_id, achievement_id) DO NOTHING
          `,
          [userId, achievementId],
        ),
      ),
    );
  }

  private resolveProgressValue(next: number | undefined, current: number): number {
    if (typeof next !== 'number' || Number.isNaN(next)) {
      return current;
    }

    return Math.max(0, Math.trunc(next));
  }
}
