import { Injectable } from '@nestjs/common';

import { ApiException } from '../common/errors/api-exception';
import { type Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { achievementDefinitions } from './definitions';
import { ACHIEVEMENTS_ERRORS } from './achievements-errors';
import {
  type AchievementStatus,
  type AchievementsProfileResponse,
} from './types';

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reads progress without granting rewards. Ordinary reads use this.prisma.
   * Quiz completion passes its transaction client so this read sees that
   * transaction's uncommitted rewards/counters instead of the old committed state.
   * This method joins the caller's transaction; it does not start a new one.
   */
  async getProfile(
    userId: string,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<AchievementsProfileResponse> {
    const [user, learnedWordsCount] = await Promise.all([
      client.user.findUnique({ where: { id: userId } }),
      client.dictionaryWord.count({ where: { progress: 'learned', userId } }),
    ]);
    if (!user) throw new ApiException(ACHIEVEMENTS_ERRORS.USER_NOT_FOUND);
    const unlockedRows = await client.userAchievement.findMany({
      where: { userId },
    });
    const progress = {
      balance: user.balance,
      lessonsCompleted: user.lessonsCompleted,
      testsCompleted: user.testsCompleted,
      wordsLearned: learnedWordsCount,
    };
    const unlockedMap = new Map(
      unlockedRows.map((row) => [row.achievementId, row]),
    );
    return {
      userId,
      progress,
      achievements: achievementDefinitions.map((definition) => {
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
      }),
    };
  }

  /** Awards eligible achievements inside the caller's progress transaction.
   * The caller locks the user's row before changing progress. Uniqueness protects
   * grants and the loop includes achievements unlocked by other achievement coins.
   * Profile reads never call this method and never grant coins.
   */
  async awardUnlocked(
    userId: string,
    transaction: Prisma.TransactionClient,
  ): Promise<AchievementStatus[]> {
    const grantedIds = new Set<string>();
    let profile = await this.getProfile(userId, transaction);
    let eligible = this.getEligibleAchievements(profile);

    while (eligible.length > 0) {
      const now = new Date();
      const inserted = await transaction.userAchievement.createManyAndReturn({
        data: eligible.map((definition) => ({
          userId,
          achievementId: definition.id,
          unlockedAt: now,
          claimedAt: now,
        })),
        select: { achievementId: true },
        skipDuplicates: true,
      });
      if (inserted.length === 0) break;
      for (const row of inserted) grantedIds.add(row.achievementId);
      const reward = eligible
        .filter((definition) =>
          inserted.some((row) => row.achievementId === definition.id),
        )
        .reduce((total, definition) => total + definition.coinsReward, 0);
      await transaction.user.updateMany({
        where: { id: userId },
        data: { balance: { increment: reward } },
      });

      // Achievement coins can make another achievement eligible.
      profile = await this.getProfile(userId, transaction);
      eligible = this.getEligibleAchievements(profile);
    }

    return profile.achievements.filter((achievement) =>
      grantedIds.has(achievement.id),
    );
  }

  /**
   * Returns achievements whose rules are satisfied but which have not been granted.
   * definition.isEligible evaluates current progress (for example, balance >= 1000).
   * achievement.isUnlocked reflects an existing grant in the database; excluding
   * it prevents paying again, even if its rule is still satisfied.
   */
  private getEligibleAchievements(profile: AchievementsProfileResponse) {
    return achievementDefinitions.filter(
      (definition) =>
        definition.isEligible(profile.progress) &&
        !profile.achievements.some(
          (achievement) =>
            achievement.id === definition.id && achievement.isUnlocked,
        ),
    );
  }
}
