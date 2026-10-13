import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { MascotController } from './mascot.controller';
import { MascotService } from './mascot.service';

@Module({
  imports: [AuthModule],
  controllers: [MascotController],
  providers: [MascotService],
})
export class MascotModule {}
