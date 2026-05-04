import { Body, Controller, Get, Param, Patch } from '@nestjs/common';

import { AchievementsService } from './achievements.service';
import {
  type AchievementsProfileResponse,
  type UpdateProgressDto,
} from './types';

@Controller('achievements')
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
