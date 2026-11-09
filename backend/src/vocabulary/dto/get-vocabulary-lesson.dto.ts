import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../common/validation/transforms';

export class GetVocabularyLessonDto {
  @ApiProperty({
    type: String,
    minLength: 1,
    description: 'Lesson slug. Trimmed before validation.',
  })
  @IsString()
  @IsNotEmpty()
  @Trim()
  declare slug: string;
}
