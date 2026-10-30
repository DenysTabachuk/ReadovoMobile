import { Injectable } from '@nestjs/common';
import { AchievementsService } from '../achievements/achievements.service';
import type {
  DictionaryWordProgress,
  Prisma,
} from '../generated/prisma/client';

const REQUIRED_CORRECT_ANSWERS = 5;
type ReviewAnswerInput = { userId: string; wordId: string; isCorrect: boolean };

@Injectable()
export class DictionaryReviewService {
  constructor(private readonly achievements: AchievementsService) {}

  /** Applies one persisted quiz attempt; the caller locks the owner and deduplicates attempts. */
  async applyAnswer(
    transaction: Prisma.TransactionClient,
    input: ReviewAnswerInput,
  ) {
    const word = await transaction.dictionaryWord.findFirst({
      where: { id: input.wordId, userId: input.userId },
    });
    // Deleted words keep their quiz snapshot/score but no longer receive review updates.
    if (!word) return [];
    let correctAnswersCount = word.correctAnswersCount;
    if (input.isCorrect) {
      correctAnswersCount = Math.min(
        correctAnswersCount + 1,
        REQUIRED_CORRECT_ANSWERS,
      );
    } else if (word.progress === 'learned') {
      correctAnswersCount = REQUIRED_CORRECT_ANSWERS - 1;
    }

    let progress: DictionaryWordProgress = 'in_progress';
    if (input.isCorrect && correctAnswersCount >= REQUIRED_CORRECT_ANSWERS) {
      progress = 'learned';
    }
    await transaction.dictionaryWord.update({
      where: { id: word.id },
      data: {
        correctAnswersCount,
        progress,
        lastReviewedAt: new Date(),
      },
    });
    return this.achievements.awardUnlocked(input.userId, transaction);
  }
}
