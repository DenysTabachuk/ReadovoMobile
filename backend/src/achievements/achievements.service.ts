import { Injectable, NotFoundException } from '@nestjs/common';

import { type UserAchievement } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { achievementDefinitions } from './definitions';
import { type UpdateProgressDto } from './dto';
import {
  type AchievementStatus,
  type AchievementsProfileResponse,
  type UserProgress,
} from './types';

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<AchievementsProfileResponse> {
    let progress = await this.getUserProgress(userId);
    let unlockedRows = await this.getUnlockedRows(userId);

    while (await this.persistNewUnlocks(userId, progress, unlockedRows)) {
      progress = await this.getUserProgress(userId);
      unlockedRows = await this.getUnlockedRows(userId);
    }

    const unlockedMap = new Map(
      unlockedRows.map((row) => [row.achievementId, row]),
    );

    const achievements: AchievementStatus[] = achievementDefinitions.map(
      (definition) => {
        const unlocked = unlockedMap.get(definition.id);
        return {
          badgeKey: definition.badgeKey,
          claimedAt: unlocked?.claimedAt?.toISOString() ?? null,
          coinsReward: definition.coinsReward,
          descriptionKey: definition.descriptionKey,
          id: definition.id,
          isClaimed: Boolean(unlocked?.claimedAt),
          isUnlocked: Boolean(unlocked),
          progressValue: definition.getProgressValue(progress),
          targetValue: definition.targetValue,
          titleKey: definition.titleKey,
          unlockedAt: unlocked?.unlockedAt?.toISOString() ?? null,
        };
      },
    );

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

    await this.prisma.user.updateMany({
      data: {
        balance: next.balance,
        lessonsCompleted: next.lessonsCompleted,
        testsCompleted: next.testsCompleted,
        wordsLearned: next.wordsLearned,
      },
      where: { id: userId },
    });

    return this.getProfile(userId);
  }

  private async getUserProgress(userId: string): Promise<UserProgress> {
    const [row, learnedWordsCount] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.dictionaryWord.count({
        where: { progress: 'learned', userId },
      }),
    ]);

    if (!row) {
      throw new NotFoundException('User not found.');
    }

    return {
      balance: row.balance,
      lessonsCompleted: row.lessonsCompleted,
      testsCompleted: row.testsCompleted,
      wordsLearned: learnedWordsCount,
    };
  }

  private getUnlockedRows(userId: string): Promise<UserAchievement[]> {
    return this.prisma.userAchievement.findMany({ where: { userId } });
  }

  private async persistNewUnlocks(
    userId: string,
    progress: UserProgress,
    unlockedRows: UserAchievement[],
  ): Promise<boolean> {
    const unlockedIds = new Set(unlockedRows.map((row) => row.achievementId));
    const newUnlockDefinitions = achievementDefinitions.filter(
      (definition) =>
        definition.isUnlocked(progress) && !unlockedIds.has(definition.id),
    );

    if (newUnlockDefinitions.length === 0) {
      return false;
    }

    const rewardByAchievementId = new Map<string, number>(
      achievementDefinitions.map((definition) => [
        definition.id,
        definition.coinsReward,
      ]),
    );
    const now = new Date();

    return this.prisma.$transaction(async (transaction) => {
      const inserted = await transaction.userAchievement.createManyAndReturn({
        data: newUnlockDefinitions.map((definition) => ({
          achievementId: definition.id,
          claimedAt: now,
          unlockedAt: now,
          userId,
        })),
        select: { achievementId: true },
        skipDuplicates: true,
      });
      const totalCoinsReward = inserted.reduce(
        (sum, achievement) =>
          sum + (rewardByAchievementId.get(achievement.achievementId) ?? 0),
        0,
      );

      if (totalCoinsReward > 0) {
        await transaction.user.updateMany({
          data: { balance: { increment: totalCoinsReward } },
          where: { id: userId },
        });
      }

      return inserted.length > 0;
    });
  }

  private resolveProgressValue(
    next: number | undefined,
    current: number,
  ): number {
    if (typeof next !== 'number' || Number.isNaN(next)) {
      return current;
    }

    return Math.max(0, Math.trunc(next));
  }
}
