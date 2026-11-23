import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { LearningReadingOptionDto } from './learning-reading-option.dto';

@ApiSchema({ name: 'LearningReadingQuestion' })
export class LearningReadingQuestionDto {
  @ApiProperty({ type: String })
  declare id: string;
  @ApiProperty({ type: String })
  declare prompt: string;
  @ApiProperty({ type: [LearningReadingOptionDto] })
  declare options: LearningReadingOptionDto[];
}
