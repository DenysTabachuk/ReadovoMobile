import { ApiProperty, ApiSchema } from '@nestjs/swagger';

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
    description:
      'Storage object key; media URL delivery is not configured by this API.',
  })
  declare imageKey: string;

  @ApiProperty({ type: String, format: 'uri' })
  declare imageSourceUrl: string;

  @ApiProperty({ type: String })
  declare imageLicense: string;

  @ApiProperty({ type: String })
  declare imageAttribution: string;
}
