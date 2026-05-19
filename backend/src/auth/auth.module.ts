import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { JwtService } from './jwt.service';
import { PendingRegistrationsRepository } from './pending-registrations.repository';
import { PasswordResetRequestsRepository } from './password-reset-requests.repository';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { UserAuthGuard } from './user-auth.guard';
import { UsersRepository } from './users.repository';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailVerificationService,
    JwtService,
    PendingRegistrationsRepository,
    PasswordResetRequestsRepository,
    RefreshTokensRepository,
    UserAuthGuard,
    UsersRepository,
  ],
  exports: [JwtService, UserAuthGuard],
})
export class AuthModule {}
