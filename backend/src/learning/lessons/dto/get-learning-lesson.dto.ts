import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { VocabularyLevel } from '../../../generated/prisma/enums';
import { LearningLocaleDto } from '../../dto/learning-locale.dto';

export class GetLearningLessonDto extends LearningLocaleDto {
  @ApiProperty({ enum: VocabularyLevel, enumName: 'VocabularyLevel' })
  @IsEnum(VocabularyLevel)
  declare level: VocabularyLevel;
}
