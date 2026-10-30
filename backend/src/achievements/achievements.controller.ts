import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { UserAuthGuard } from '../auth/user-auth.guard';
import { UserIdParamsDto } from '../common/validation/request.dto';
import { AchievementsService } from './achievements.service';
import { type AchievementsProfileResponse } from './types';

@Controller('achievements')
@UseGuards(UserAuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('profile/:userId')
  async getProfile(
    @Param() { userId }: UserIdParamsDto,
  ): Promise<AchievementsProfileResponse> {
    return this.achievementsService.getProfile(userId);
  }
}
