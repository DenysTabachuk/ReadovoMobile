import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../../common/validation/transforms';

export class LearningLessonSlugDto {
  @ApiProperty({ type: String, minLength: 1 })
  @IsString()
  @IsNotEmpty()
  @Trim()
  declare slug: string;
}
