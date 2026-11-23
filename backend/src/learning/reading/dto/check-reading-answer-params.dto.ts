import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../../common/validation/transforms';
import { LearningLessonSlugDto } from '../../lessons/dto/learning-lesson-slug.dto';

export class CheckReadingAnswerParamsDto extends LearningLessonSlugDto {
  @ApiProperty({ type: String, minLength: 1 })
  @IsString()
  @IsNotEmpty()
  @Trim()
  declare questionId: string;
}
