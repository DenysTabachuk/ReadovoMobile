import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AchievementsController],
  providers: [AchievementsService],
})
export class AchievementsModule {}
