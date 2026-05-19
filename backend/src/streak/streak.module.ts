import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { StreakController } from './streak.controller';
import { StreakService } from './streak.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [StreakController],
  providers: [StreakService],
  exports: [StreakService],
})
export class StreakModule {}
