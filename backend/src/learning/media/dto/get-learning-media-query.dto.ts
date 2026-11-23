import { ApiProperty } from '@nestjs/swagger';
import { Matches, MaxLength } from 'class-validator';

import { LEARNING_IMAGE_KEY, MAX_MEDIA_KEY_LENGTH } from '../constants';

export class GetLearningMediaQueryDto {
  @ApiProperty({
    example: 'learning/topics/germany/v1.png',
    maxLength: MAX_MEDIA_KEY_LENGTH,
    pattern: LEARNING_IMAGE_KEY.source,
  })
  @Matches(LEARNING_IMAGE_KEY)
  @MaxLength(MAX_MEDIA_KEY_LENGTH)
  declare key: string;
}
