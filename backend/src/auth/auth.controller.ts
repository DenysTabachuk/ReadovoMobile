import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import { AUTH_ERRORS } from './auth-errors';
import { AuthSessionResponseDto } from './dto/auth-session-response.dto';
import { VerificationCodeDeliveryResponseDto } from './dto/verification-code-delivery-response.dto';
import { VerifyPasswordResetCodeResponseDto } from './dto/verify-password-reset-code-response.dto';
import { ResetPasswordResponseDto } from './dto/reset-password-response.dto';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RefreshSessionDto } from './dto/refresh-session.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto';
import { VerifyPasswordResetCodeDto } from './dto/verify-password-reset-code.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
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
@ApiTags('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    operationId: 'loginUser',
    summary: 'Sign in with email and password',
    security: [],
  })
  @ApiCreatedResponse({ type: AuthSessionResponseDto })
  @ApiErrorResponses({
    validation: true,
    errors: [AUTH_ERRORS.CREDENTIALS_INVALID],
  })
  async login(@Body() loginUserDto: LoginUserDto): Promise<LoginUserResponse> {
    return this.authService.login(loginUserDto);
  }

  @Post('google')
  @ApiOperation({
    operationId: 'loginWithGoogle',
    summary: 'Exchange a verified Google ID token for an app session',
    security: [],
  })
  @ApiCreatedResponse({ type: AuthSessionResponseDto })
  @ApiErrorResponses({
    validation: true,
    errors: [AUTH_ERRORS.GOOGLE_IDENTITY_REJECTED],
  })
  async loginWithGoogle(
    @Body() googleLoginDto: GoogleLoginDto,
  ): Promise<LoginUserResponse> {
    return this.authService.loginWithGoogle(googleLoginDto);
  }

  @Post('refresh')
  @ApiOperation({
    operationId: 'refreshAuthSession',
    summary: 'Rotate a session using its refresh credential',
    security: [],
  })
  @ApiCreatedResponse({ type: AuthSessionResponseDto })
  @ApiErrorResponses({
    validation: true,
    errors: [AUTH_ERRORS.REFRESH_REJECTED],
  })
  async refreshSession(
    @Body() refreshSessionDto: RefreshSessionDto,
  ): Promise<LoginUserResponse> {
    return this.authService.refreshSession(refreshSessionDto);
  }

  @Post('register')
  @ApiOperation({
    operationId: 'registerUser',
    summary: 'Create a pending registration and send a verification code',
    security: [],
  })
  @ApiCreatedResponse({ type: VerificationCodeDeliveryResponseDto })
  @ApiErrorResponses({
    validation: true,
    errors: [AUTH_ERRORS.EMAIL_ALREADY_EXISTS],
  })
  async register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<RegisterUserResponse> {
    const response = await this.authService.register(registerUserDto);

    this.logger.log(`Register response: ${JSON.stringify(response)}`);

    return response;
  }

  @Post('verify-email')
  @ApiOperation({
    operationId: 'verifyEmail',
    summary: 'Verify a pending registration and create a session',
    security: [],
  })
  @ApiCreatedResponse({ type: AuthSessionResponseDto })
  @ApiErrorResponses({
    validation: true,
    errors: [
      AUTH_ERRORS.EMAIL_ALREADY_EXISTS,
      AUTH_ERRORS.REGISTRATION_NOT_PENDING,
      AUTH_ERRORS.VERIFICATION_CODE_INVALID,
      AUTH_ERRORS.VERIFICATION_CODE_EXPIRED,
    ],
  })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<VerifyEmailResponse> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification-code')
  @ApiOperation({
    operationId: 'resendVerificationCode',
    summary: 'Resend a pending registration’s verification code',
    security: [],
  })
  @ApiCreatedResponse({ type: VerificationCodeDeliveryResponseDto })
  @ApiErrorResponses({
    validation: true,
    errors: [
      AUTH_ERRORS.EMAIL_ALREADY_EXISTS,
      AUTH_ERRORS.REGISTRATION_NOT_PENDING,
    ],
  })
  async resendVerificationCode(
    @Body() resendVerificationCodeDto: ResendVerificationCodeDto,
  ): Promise<ResendVerificationCodeResponse> {
    return this.authService.resendVerificationCode(resendVerificationCodeDto);
  }

  @Post('request-password-reset')
  @ApiOperation({
    operationId: 'requestPasswordReset',
    summary:
      'Request a password-reset code without revealing account existence',
    security: [],
  })
  @ApiCreatedResponse({ type: VerificationCodeDeliveryResponseDto })
  @ApiErrorResponses({ validation: true })
  async requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
  ): Promise<RequestPasswordResetResponse> {
    return this.authService.requestPasswordReset(requestPasswordResetDto);
  }

  @Post('verify-password-reset-code')
  @ApiOperation({
    operationId: 'verifyPasswordResetCode',
    summary: 'Exchange a password-reset code for a reset credential',
    security: [],
  })
  @ApiCreatedResponse({ type: VerifyPasswordResetCodeResponseDto })
  @ApiErrorResponses({
    validation: true,
    errors: [AUTH_ERRORS.RESET_CODE_INVALID, AUTH_ERRORS.RESET_CODE_EXPIRED],
  })
  async verifyPasswordResetCode(
    @Body() verifyPasswordResetCodeDto: VerifyPasswordResetCodeDto,
  ): Promise<VerifyPasswordResetCodeResponse> {
    return this.authService.verifyPasswordResetCode(verifyPasswordResetCodeDto);
  }

  @Post('reset-password')
  @ApiOperation({
    operationId: 'resetPassword',
    summary: 'Change a password using a verified reset credential',
    security: [],
  })
  @ApiCreatedResponse({ type: ResetPasswordResponseDto })
  @ApiErrorResponses({
    validation: true,
    errors: [
      AUTH_ERRORS.RESET_REQUEST_INVALID,
      AUTH_ERRORS.RESET_REQUEST_EXPIRED,
    ],
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResponse> {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
