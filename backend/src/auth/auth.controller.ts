import { Body, Controller, Logger, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { type LoginUserDto } from './dto/login-user.dto';
import { type RegisterUserDto } from './dto/register-user.dto';
import { type RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { type ResetPasswordDto } from './dto/reset-password.dto';
import { type ResendVerificationCodeDto } from './dto/resend-verification-code.dto';
import { type VerifyPasswordResetCodeDto } from './dto/verify-password-reset-code.dto';
import { type VerifyEmailDto } from './dto/verify-email.dto';
import {
  type LoginUserResponse,
  type RegisterUserResponse,
  type RequestPasswordResetResponse,
  type ResetPasswordResponse,
  type ResendVerificationCodeResponse,
  type VerifyPasswordResetCodeResponse,
  type VerifyEmailResponse,
} from './types';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto): Promise<LoginUserResponse> {
    return this.authService.login(loginUserDto);
  }

  @Post('register')
  async register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<RegisterUserResponse> {
    const response = await this.authService.register(registerUserDto);

    this.logger.log(`Register response: ${JSON.stringify(response)}`);

    return response;
  }

  @Post('verify-email')
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<VerifyEmailResponse> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification-code')
  async resendVerificationCode(
    @Body() resendVerificationCodeDto: ResendVerificationCodeDto,
  ): Promise<ResendVerificationCodeResponse> {
    return this.authService.resendVerificationCode(resendVerificationCodeDto);
  }

  @Post('request-password-reset')
  async requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
  ): Promise<RequestPasswordResetResponse> {
    return this.authService.requestPasswordReset(requestPasswordResetDto);
  }

  @Post('verify-password-reset-code')
  async verifyPasswordResetCode(
    @Body() verifyPasswordResetCodeDto: VerifyPasswordResetCodeDto,
  ): Promise<VerifyPasswordResetCodeResponse> {
    return this.authService.verifyPasswordResetCode(verifyPasswordResetCodeDto);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResponse> {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
