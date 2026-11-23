import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'VocabularyPracticeOption' })
export class VocabularyPracticeOptionDto {
  @ApiProperty({ type: String })
  declare id: string;

  @ApiProperty({ type: String })
  declare word: string;

  @ApiProperty({ type: String })
  declare imageKey: string;
}
