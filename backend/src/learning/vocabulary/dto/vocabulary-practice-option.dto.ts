import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { LEARNING_MEDIA_URL_PATTERN } from '../../media/constants';

@ApiSchema({ name: 'VocabularyPracticeOption' })
export class VocabularyPracticeOptionDto {
  @ApiProperty({ type: String })
  declare id: string;

  @ApiProperty({ type: String })
  declare word: string;

  @ApiProperty({ type: String })
  declare imageKey: string;

  @ApiProperty({
    type: String,
    nullable: true,
    pattern: LEARNING_MEDIA_URL_PATTERN,
  })
  declare imageUrl: string | null;
}
