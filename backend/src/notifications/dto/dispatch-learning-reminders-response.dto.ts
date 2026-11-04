import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'LearningReminderDispatchResponse' })
export class DispatchLearningRemindersResponseDto {
  @ApiProperty({ type: 'integer', minimum: 0 })
  declare checkedCount: number;

  @ApiProperty({ type: 'integer', minimum: 0 })
  declare skippedAlreadySentCount: number;

  @ApiProperty({ type: 'integer', minimum: 0 })
  declare skippedCompletedTodayCount: number;

  @ApiProperty({ type: 'integer', minimum: 0 })
  declare skippedNoTokensCount: number;

  @ApiProperty({ type: 'integer', minimum: 0 })
  declare skippedOutsideWindowCount: number;

  @ApiProperty({ type: 'integer', minimum: 0 })
  declare skippedSendFailedCount: number;

  @ApiProperty({ type: 'integer', minimum: 0 })
  declare sentCount: number;
}
