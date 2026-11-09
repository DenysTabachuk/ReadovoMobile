import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { VocabularyLevel } from '../../generated/prisma/enums';

@ApiSchema({ name: 'VocabularyLessonSummary' })
export class VocabularyLessonSummaryDto {
  @ApiProperty({ type: String, format: 'uuid' })
  declare id: string;

  @ApiProperty({ type: String })
  declare slug: string;

  @ApiProperty({ enum: VocabularyLevel, enumName: 'VocabularyLevel' })
  declare level: VocabularyLevel;

  @ApiProperty({
    type: String,
    description: 'Requested locale, falling back to English.',
  })
  declare title: string;

  @ApiProperty({ type: String })
  declare description: string;

  @ApiProperty({ type: Number, minimum: 0 })
  declare wordCount: number;

  @ApiProperty({ type: Number, minimum: 0 })
  declare stageCount: number;
}
