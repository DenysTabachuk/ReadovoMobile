import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ClearTodayLearningReminderDispatchResponse' })
export class ClearTodayLearningReminderDispatchResponseDto {
  @ApiProperty({ type: 'integer', minimum: 0 })
  declare deletedCount: number;
}
