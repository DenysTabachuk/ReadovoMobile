import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MascotController } from './mascot.controller';
import { MascotService } from './mascot.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [MascotController],
  providers: [MascotService],
})
export class MascotModule {}
