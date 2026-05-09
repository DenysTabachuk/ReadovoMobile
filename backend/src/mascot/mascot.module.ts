import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { MascotController } from './mascot.controller';
import { MascotService } from './mascot.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MascotController],
  providers: [MascotService],
})
export class MascotModule {}
