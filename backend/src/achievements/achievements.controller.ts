import { Controller, Get, UseGuards } from '@nestjs/common';

import { UserAuthGuard } from '../auth/user-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { AchievementsService } from './achievements.service';
import { type AchievementsProfileResponse } from './types';

@Controller('achievements')
@UseGuards(UserAuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('profile/me')
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AchievementsProfileResponse> {
    return this.achievementsService.getProfile(user.id);
  }
}
