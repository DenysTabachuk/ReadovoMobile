import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { PendingRegistrationsRepository } from './pending-registrations.repository';
import { UsersRepository } from './users.repository';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailVerificationService,
    PendingRegistrationsRepository,
    UsersRepository,
  ],
})
export class AuthModule {}
