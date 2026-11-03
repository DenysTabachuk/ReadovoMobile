import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

/** Serialized HTTP response; undefined properties are omitted from JSON. */
@ApiSchema({ name: 'TranslateWordResponse' })
export class TranslateWordResponseDto {
  @ApiProperty({ type: String })
  declare baseTranslation: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  context?: string | null;

  @ApiPropertyOptional({ type: String })
  contextTranslation?: string;

  @ApiPropertyOptional({ type: String })
  contextualTranslation?: string;

  @ApiProperty({ type: String })
  declare sourceLanguage: string;

  @ApiProperty({ type: String })
  declare targetLanguage: string;

  @ApiProperty({ type: String })
  declare translation: string;

  @ApiProperty({ type: String })
  declare word: string;
}
