import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { NotificationsDiagnosticsController } from './notifications-diagnostics.controller';
import { NotificationsModule } from '../notifications.module';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [NotificationsDiagnosticsController],
})
export class NotificationsDiagnosticsModule {}
