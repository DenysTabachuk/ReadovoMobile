import { z } from 'zod';

export const quizQuestionsSchema = z
  .array(
    z.object({
      id: z.string().min(1),
      type: z.enum(['single_choice', 'multiple_choice', 'true_false']),
      optionIds: z.array(z.string()).min(2),
      correctOptionIds: z.array(z.string()).min(1),
      explanation: z.string().optional(),
      // Dictionary entry to update after grading; article questions have no linked word.
      wordId: z.string().uuid().optional(),
    }),
  )
  .min(1)
  .max(100)
  // Zod supplies the parsed questions and a context for reporting validation errors.
  .superRefine((questions, context) => {
    // A Set removes duplicates, so its size must match the number of questions.
    if (
      new Set(questions.map((question) => question.id)).size !==
      questions.length
    )
      context.addIssue({ code: 'custom', message: 'Duplicate question ids.' });
    for (const question of questions) {
      if (
        // Option IDs and answer-key IDs must each be unique.
        new Set(question.optionIds).size !== question.optionIds.length ||
        new Set(question.correctOptionIds).size !==
          question.correctOptionIds.length ||
        // Every correct answer must be an option offered by this question.
        question.correctOptionIds.some(
          (id) => !question.optionIds.includes(id),
        ) ||
        // Only multiple-choice questions may have more than one correct answer.
        (question.type !== 'multiple_choice' &&
          question.correctOptionIds.length !== 1)
      ) {
        context.addIssue({
          code: 'custom',
          message: 'Invalid question answer key.',
        });
      }
    }
  });

export const quizSettingsSchema = z.object({
  kind: z.enum(['article', 'vocabulary', 'dictionary']),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']).nullable(),
  targetLength: z.enum(['short', 'medium', 'long']).nullable(),
});

export const completionSchema = z.object({
  correctAnswers: z.number().int().nonnegative(),
  totalQuestions: z.number().int().positive(),
  percentage: z.number().int().min(0).max(100),
  // Historical rewards for this session, not the current balance or another credit instruction.
  rewards: z.object({
    // Quiz formula, including first-test and perfect-score bonuses.
    quizCoins: z.number().int().nonnegative(),
    // General achievements, including grants already committed with dictionary answers.
    achievementCoins: z.number().int().nonnegative(),
    // Milestone bonuses for consecutive learning days.
    streakCoins: z.number().int().nonnegative(),
    // Sum of the three reward categories above.
    totalCoins: z.number().int().nonnegative(),
  }),
  newlyUnlockedAchievementIds: z.array(z.string()),
  newlyUnlockedStreakMilestones: z.array(z.number().int()),
  shouldShowStreakBanner: z.boolean(),
});
