import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AchievementsService } from '../achievements/achievements.service';
import { ApiException } from '../common/errors/api-exception';
import { DictionaryReviewService } from '../dictionary/dictionary-review.service';
import { Prisma, type QuizSession } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StreakService } from '../streak/streak.service';
import { calculateQuizReward } from './utils/calculateQuizReward';
import type { SubmitQuizAnswerDto } from './dto';
import { QUIZ_ERRORS } from './quiz-errors';
import {
  completionSchema,
  quizQuestionsSchema,
  quizSettingsSchema,
} from './quiz.schemas';
import type { CreateQuizSessionInput, QuizAnswerResult } from './types';

@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly achievements: AchievementsService,
    private readonly streak: StreakService,
    private readonly dictionaryReview: DictionaryReviewService,
  ) {}

  /** Saves validated generated questions and immutable reward settings for one owner. */
  async create(userId: string, input: CreateQuizSessionInput): Promise<string> {
    // .parse validates the data at runtime and throws if its structure is invalid.
    const questions = quizQuestionsSchema.parse(input.questions);
    const session = await this.prisma.quizSession.create({
      data: {
        id: randomUUID(),
        userId,
        kind: input.kind,
        level: input.level,
        targetLength: input.targetLength,
        questions,
      },
    });
    return session.id;
  }

  /** Stores the first graded answer; identical retries return feedback without another review update. */
  async answer(
    userId: string,
    sessionId: string,
    input: SubmitQuizAnswerDto,
  ): Promise<QuizAnswerResult> {
    return this.withOwnerLock(userId, async (transaction) => {
      const session = await this.getSession(transaction, userId, sessionId);
      const question = quizQuestionsSchema
        .parse(session.questions)
        .find((candidate) => candidate.id === input.questionId);
      // .some means "at least one": reject options outside this question and
      // reject multiple selections unless the question allows multiple choice.
      if (
        !question ||
        input.selectedOptionIds.some(
          (id) => !question.optionIds.includes(id),
        ) ||
        (question.type !== 'multiple_choice' &&
          input.selectedOptionIds.length !== 1)
      )
        throw new ApiException(QUIZ_ERRORS.ANSWER_INVALID);
      let savedAnswer = await transaction.quizAnswer.findUnique({
        // Prisma's compound unique key identifies one answer per session/question.
        where: { sessionId_questionId: { sessionId, questionId: question.id } },
      });
      if (
        savedAnswer &&
        (savedAnswer.selectedOptionIds.length !==
          input.selectedOptionIds.length ||
          savedAnswer.selectedOptionIds.some(
            (id) => !input.selectedOptionIds.includes(id),
          ))
      ) {
        // Compare selections without relying on order; a graded attempt cannot be changed.
        throw new ApiException(QUIZ_ERRORS.ANSWER_ALREADY_SUBMITTED);
      }
      // Equal lengths + every correct ID selected means an exact answer-set match.
      const isCorrect =
        question.correctOptionIds.length === input.selectedOptionIds.length &&
        question.correctOptionIds.every((id) =>
          input.selectedOptionIds.includes(id),
        );
      if (!savedAnswer) {
        if (session.completedAt)
          throw new ApiException(QUIZ_ERRORS.SESSION_COMPLETED);
        // Only dictionary questions have a linked word. Review and answer storage
        // share this transaction, so retries cannot advance the word twice.
        const unlocks = question.wordId
          ? await this.dictionaryReview.applyAnswer(transaction, {
              userId,
              wordId: question.wordId,
              isCorrect,
            })
          : [];
        savedAnswer = await transaction.quizAnswer.create({
          data: {
            sessionId,
            questionId: question.id,
            selectedOptionIds: input.selectedOptionIds,
            isCorrect,
            unlockedAchievementIds: unlocks.map((unlock) => unlock.id),
          },
        });
      }
      // Reveal the answer key only after the submitted attempt has been recorded.
      return {
        newlyUnlockedAchievementIds: savedAnswer.unlockedAchievementIds,
        isCorrect,
        correctOptionIds: question.correctOptionIds,
        explanation: question.explanation,
      };
    });
  }

  /** Commits quiz rewards, counters, achievements, streak and the completion record together. */
  async complete(userId: string, sessionId: string, timezone?: string) {
    return this.withOwnerLock(userId, async (transaction) => {
      const session = await this.getSession(transaction, userId, sessionId);
      // A retry returns the saved completion; none of the reward writes below run again.
      if (session.completedAt) return this.toResult(transaction, session, true);
      const questions = quizQuestionsSchema.parse(session.questions);
      const answers = await transaction.quizAnswer.findMany({
        where: { sessionId },
      });
      // Matching counts alone are insufficient: every saved question needs an answer.
      if (
        answers.length !== questions.length ||
        questions.some(
          (question) =>
            !answers.some((answer) => answer.questionId === question.id),
        )
      )
        throw new ApiException(QUIZ_ERRORS.SESSION_INCOMPLETE);
      // Grade from persisted answers and saved settings, never client-reported scores.
      const settings = quizSettingsSchema.parse(session);
      const before = await this.achievements.getProfile(userId, transaction);
      // This read reconciles missing days, so it must already use the completion's timezone.
      const previousStreak = await this.streak.getQuizCompletionProfile(
        transaction,
        userId,
        timezone,
      );
      const correctAnswers = answers.filter(
        (answer) => answer.isCorrect,
      ).length;
      const percentage = Math.round((correctAnswers / questions.length) * 100);
      const quizCoins = calculateQuizReward({
        percentage,
        firstTest: before.progress.testsCompleted === 0,
        level: settings.level,
        targetLength: settings.targetLength,
      });
      // Prisma increments in the database instead of replacing a previously read balance.
      await transaction.user.update({
        where: { id: userId },
        data: {
          balance: { increment: quizCoins },
          testsCompleted: { increment: 1 },
        },
      });
      // Apply streak rewards before evaluating achievements: these coins can satisfy a threshold.
      const { streak } = await this.streak.recordQuizCompletion(
        transaction,
        userId,
        timezone,
      );
      const newUnlocks = await this.achievements.awardUnlocked(
        userId,
        transaction,
      );
      const profile = await this.achievements.getProfile(userId, transaction);
      // flatMap joins answer-level ID arrays; Set removes duplicates; ... expands
      // the Set back into an array, including achievements granted at completion.
      const achievementIds = [
        ...new Set([
          ...answers.flatMap((answer) => answer.unlockedAchievementIds),
          ...newUnlocks.map((unlock) => unlock.id),
        ]),
      ];
      // This is a reward breakdown, not another credit: answer-level grants are already paid.
      // .reduce adds each matching achievement's coins to the running total, starting at 0.
      const achievementCoins = profile.achievements
        .filter((achievement) => achievementIds.includes(achievement.id))
        .reduce((total, achievement) => total + achievement.coinsReward, 0);
      // Only milestones absent before this completion belong to its reward breakdown.
      const streakUnlocks = streak.claimedStreakAchievements.filter(
        (achievement) =>
          achievement.isUnlocked &&
          !previousStreak.claimedStreakAchievements.some(
            (previous) =>
              previous.milestone === achievement.milestone &&
              previous.isUnlocked,
          ),
      );
      const streakCoins = streakUnlocks.reduce(
        (total, achievement) => total + achievement.rewardCoins,
        0,
      );
      const completion = {
        correctAnswers,
        totalQuestions: questions.length,
        percentage,
        rewards: {
          quizCoins,
          achievementCoins,
          streakCoins,
          totalCoins: quizCoins + achievementCoins + streakCoins,
        },
        newlyUnlockedAchievementIds: achievementIds,
        newlyUnlockedStreakMilestones: streakUnlocks.map(
          (achievement) => achievement.milestone,
        ),
        shouldShowStreakBanner:
          previousStreak.todayStatus !== 'completed' &&
          streak.todayStatus === 'completed',
      };
      // Save the immutable result in the same transaction as its rewards for safe retries.
      const completed = await transaction.quizSession.update({
        where: { id: sessionId },
        data: { completedAt: new Date(), completion },
      });
      return this.toResult(transaction, completed, false);
    });
  }

  /** Creates a new owned attempt with the same grading/settings, without copying answers or rewards. */
  async retake(userId: string, sessionId: string) {
    const original = await this.getSession(this.prisma, userId, sessionId);
    const settings = quizSettingsSchema.parse(original);
    return this.create(userId, {
      kind: settings.kind,
      // Optional settings are stored as null in the DB; create accepts undefined.
      level: settings.level ?? undefined,
      targetLength: settings.targetLength ?? undefined,
      questions: quizQuestionsSchema.parse(original.questions),
    });
  }

  /**
   * Runs the callback in one transaction while holding the user's row lock.
   * <T> preserves the callback's result type; Promise<T> returns that result after commit.
   * Errors roll back all writes. The row lock is released on commit or rollback.
   */
  private async withOwnerLock<T>(
    userId: string,
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    // A single owner lock serializes different sessions too, so the first-test
    // bonus is decided once. Atomic increments preserve concurrent spending.
    return this.prisma.$transaction(async (transaction) => {
      // This tagged template is Prisma's parameterized SQL, not string concatenation.
      // ::uuid is a PostgreSQL cast; FOR UPDATE makes competing owner operations wait.
      await transaction.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      return operation(transaction);
    });
  }

  private async getSession(
    transaction: Prisma.TransactionClient,
    userId: string,
    sessionId: string,
  ) {
    // Unknown and foreign sessions both look missing; never expose another owner's attempt.
    const session = await transaction.quizSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new ApiException(QUIZ_ERRORS.SESSION_NOT_FOUND);
    return session;
  }

  private async toResult(
    transaction: Prisma.TransactionClient,
    session: QuizSession,
    replayed: boolean,
  ) {
    // Historical score/rewards stay fixed; profiles are read fresh, including on replay.
    return {
      sessionId: session.id,
      replayed,
      completion: completionSchema.parse(session.completion),
      profile: await this.achievements.getProfile(session.userId, transaction),
      streak: await this.streak.getQuizCompletionProfile(
        transaction,
        session.userId,
      ),
    };
  }
}
