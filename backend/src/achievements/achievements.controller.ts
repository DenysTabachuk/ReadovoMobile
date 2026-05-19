import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';

import { UserAuthGuard } from '../auth/user-auth.guard';
import { AchievementsService } from './achievements.service';
import {
  type AchievementsProfileResponse,
  type UpdateProgressDto,
} from './types';

@Controller('achievements')
@UseGuards(UserAuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('profile/:userId')
  async getProfile(
    @Param('userId') userId: string,
  ): Promise<AchievementsProfileResponse> {
    return this.achievementsService.getProfile(userId);
  }

  @Patch('profile/:userId/progress')
  async updateProgress(
    @Param('userId') userId: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ): Promise<AchievementsProfileResponse> {
    return this.achievementsService.updateProgress(userId, updateProgressDto);
  }
}
