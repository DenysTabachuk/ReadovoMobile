import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiUserAuth } from '../auth/api-user-auth.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { AchievementsService } from './achievements.service';
import { ACHIEVEMENTS_ERRORS } from './achievements-errors';
import { GetAchievementsProfileResponseDto } from './dto/get-achievements-profile-response.dto';
import { type AchievementsProfileResponse } from './types';

@Controller('achievements')
@ApiTags('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('profile/me')
  @ApiOperation({
    operationId: 'getAchievementsProfile',
    summary: 'Read the authenticated user’s achievement progress',
  })
  @ApiOkResponse({ type: GetAchievementsProfileResponseDto })
  @ApiUserAuth({
    errors: [ACHIEVEMENTS_ERRORS.USER_NOT_FOUND],
  })
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AchievementsProfileResponse> {
    return this.achievementsService.getProfile(user.id);
  }
}
