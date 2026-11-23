import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { VocabularyLevel } from '../../generated/prisma/enums';

@ApiSchema({ name: 'LearningEntry' })
export class LearningEntryDto {
  @ApiProperty({ type: String })
  declare slug: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Topic cover object key. Null uses the neutral catalogue illustration.',
    pattern: '^[a-z0-9][a-z0-9/_-]*\\.(png|webp|jpg|svg)$',
  })
  declare coverImageKey: string | null;
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
