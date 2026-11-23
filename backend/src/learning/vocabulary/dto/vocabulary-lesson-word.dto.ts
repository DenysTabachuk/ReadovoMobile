import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { LEARNING_MEDIA_URL_PATTERN } from '../../media/constants';

@ApiSchema({ name: 'VocabularyLessonWord' })
export class VocabularyLessonWordDto {
  @ApiProperty({ type: String })
  declare id: string;

  @ApiProperty({ type: String })
  declare word: string;

  @ApiProperty({ type: String })
  declare transcription: string;

  @ApiProperty({ type: String })
  declare translationUk: string;

  @ApiProperty({ type: String })
  declare example: string;

  @ApiProperty({ type: String })
  declare exampleTranslationUk: string;

  @ApiProperty({
    type: String,
    description: 'Stored vocabulary image object key.',
  })
  declare imageKey: string;

  @ApiProperty({
    type: String,
    nullable: true,
    pattern: LEARNING_MEDIA_URL_PATTERN,
  })
  declare imageUrl: string | null;

  @ApiProperty({ type: String, format: 'uri' })
  declare imageSourceUrl: string;

  @ApiProperty({ type: String })
  declare imageLicense: string;

  @ApiProperty({ type: String })
  declare imageAttribution: string;
}
