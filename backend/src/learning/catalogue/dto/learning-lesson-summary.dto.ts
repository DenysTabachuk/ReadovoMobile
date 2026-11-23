import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { LearningEntryDto } from '../../dto/learning-entry.dto';
import { LEARNING_MEDIA_URL_PATTERN } from '../../media/constants';

@ApiSchema({ name: 'LearningLessonSummary' })
export class LearningLessonSummaryDto extends LearningEntryDto {
  @ApiProperty({
    type: String,
    nullable: true,
    pattern: LEARNING_MEDIA_URL_PATTERN,
  })
  declare thumbnailUrl: string | null;
}
