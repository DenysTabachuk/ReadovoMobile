import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'LearningReminderPreferencesResponse' })
export class GetLearningReminderPreferencesResponseDto {
  @ApiProperty({
    type: String,
    description: 'Stored local reminder time in HH:mm format.',
    example: '19:00',
  })
  declare learningReminderTime: string;

  @ApiProperty({ type: Boolean })
  declare learningRemindersEnabled: boolean;
}
