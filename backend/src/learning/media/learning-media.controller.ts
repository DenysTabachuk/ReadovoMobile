import { Controller, Get, Header, Query, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiUserAuth } from '../../auth/api-user-auth.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types';
import { LEARNING_ERRORS } from '../learning-errors';
import { LEARNING_IMAGE_TYPES, LEARNING_MEDIA_PATH } from './constants';
import { GetLearningMediaQueryDto } from './dto/get-learning-media-query.dto';
import { LearningMediaService } from './learning-media.service';

@ApiTags('learning')
@Controller(LEARNING_MEDIA_PATH)
export class LearningMediaController {
  constructor(private readonly media: LearningMediaService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    operationId: 'getLearningMedia',
    summary: 'Read private learning artwork for an authorized media account',
  })
  @ApiOkResponse({
    content: {
      [LEARNING_IMAGE_TYPES.png]: {
        schema: { type: 'string', format: 'binary' },
      },
      [LEARNING_IMAGE_TYPES.webp]: {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiUserAuth({
    validation: true,
    errors: [
      LEARNING_ERRORS.NOT_FOUND,
      LEARNING_ERRORS.MEDIA_FORBIDDEN,
      LEARNING_ERRORS.MEDIA_UNAVAILABLE,
    ],
  })
  async image(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { key }: GetLearningMediaQueryDto,
  ) {
    const { bytes, type } = await this.media.getImage(user.id, key);
    return new StreamableFile(bytes, { type });
  }
}
