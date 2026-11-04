import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { AchievementsProfileResponseDto } from '../../achievements/contracts';
import { StreakStateDto } from '../../streak/contracts';

@ApiSchema({ name: 'QuizCompletionRewards' })
export class QuizCompletionRewardsDto {
  @ApiProperty({ type: 'integer', minimum: 0 })
  declare quizCoins: number;

  @ApiProperty({ type: 'integer', minimum: 0 })
  declare achievementCoins: number;

  @ApiProperty({ type: 'integer', minimum: 0 })
  declare streakCoins: number;

  @ApiProperty({ type: 'integer', minimum: 0 })
  declare totalCoins: number;
}

@ApiSchema({ name: 'QuizCompletion' })
export class QuizCompletionDto {
  @ApiProperty({ type: 'integer', minimum: 0 })
  declare correctAnswers: number;

  @ApiProperty({ type: 'integer', minimum: 1 })
  declare totalQuestions: number;

  @ApiProperty({ type: 'integer', minimum: 0, maximum: 100 })
  declare percentage: number;

  @ApiProperty({ type: QuizCompletionRewardsDto })
  declare rewards: QuizCompletionRewardsDto;

  @ApiProperty({ type: [String] })
  declare newlyUnlockedAchievementIds: string[];

  // Persisted historical completions allow integer milestones, including older
  // values outside today's streak policy. Preserve that runtime decoder contract.
  @ApiProperty({ type: 'array', items: { type: 'integer' } })
  declare newlyUnlockedStreakMilestones: number[];

  @ApiProperty({ type: Boolean })
  declare shouldShowStreakBanner: boolean;
}

/** Historical completion totals plus freshly read achievement and streak profiles. */
@ApiSchema({ name: 'QuizCompletionResponse' })
export class CompleteQuizResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  declare sessionId: string;

  @ApiProperty({ type: Boolean })
  declare replayed: boolean;

  @ApiProperty({ type: QuizCompletionDto })
  declare completion: QuizCompletionDto;

  @ApiProperty({ type: AchievementsProfileResponseDto })
  declare profile: AchievementsProfileResponseDto;

  @ApiProperty({ type: StreakStateDto })
  declare streak: StreakStateDto;
}
