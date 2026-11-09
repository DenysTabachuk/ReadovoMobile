import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { VocabularyStageKind } from '../../generated/prisma/enums';

@ApiSchema({ name: 'VocabularyLessonStage' })
export class VocabularyLessonStageDto {
  @ApiProperty({ type: String })
  declare id: string;

  @ApiProperty({ type: Number, minimum: 0 })
  declare position: number;

  @ApiProperty({ enum: VocabularyStageKind, enumName: 'VocabularyStageKind' })
  declare kind: VocabularyStageKind;

  @ApiProperty({ type: String })
  declare title: string;

  @ApiProperty({ type: String })
  declare description: string;

  @ApiProperty({
    type: [String],
    description:
      'Word IDs in card/roster order, referencing the lesson words array.',
  })
  declare wordIds: string[];

  @ApiProperty({ type: Number, minimum: 0 })
  declare exerciseCount: number;
}
