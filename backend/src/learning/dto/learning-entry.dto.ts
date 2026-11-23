import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { VocabularyLevel } from '../../generated/prisma/enums';
import { LEARNING_MEDIA_URL_PATTERN } from '../media/constants';

@ApiSchema({ name: 'LearningEntry' })
export class LearningEntryDto {
  @ApiProperty({ type: String })
  declare slug: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'API-relative URL of the cover, or null if unavailable.',
    pattern: LEARNING_MEDIA_URL_PATTERN,
  })
  declare coverImageUrl: string | null;
  @ApiProperty({ type: String })
  declare title: string;
  @ApiProperty({ type: String })
  declare description: string;
  @ApiProperty({
    enum: VocabularyLevel,
    enumName: 'VocabularyLevel',
    isArray: true,
  })
  declare availableLevels: VocabularyLevel[];
}
