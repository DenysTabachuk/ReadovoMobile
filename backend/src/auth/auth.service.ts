import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  pbkdf2Sync,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';

import { type LoginUserDto } from './dto/login-user.dto';
import { type RegisterUserDto } from './dto/register-user.dto';
import { type GoogleLoginDto } from './dto/google-login.dto';
import { type RefreshSessionDto } from './dto/refresh-session.dto';
import { type RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { type ResetPasswordDto } from './dto/reset-password.dto';
import { type ResendVerificationCodeDto } from './dto/resend-verification-code.dto';
import { type VerifyPasswordResetCodeDto } from './dto/verify-password-reset-code.dto';
import { type VerifyEmailDto } from './dto/verify-email.dto';
import { EmailVerificationService } from './email-verification.service';
import { PendingRegistrationsRepository } from './pending-registrations.repository';
import { PasswordResetRequestsRepository } from './password-reset-requests.repository';
import {
  type AuthUser,
  type LoginUserResponse,
  type PendingUserRegistration,
  type RegisterUserResponse,
  type RequestPasswordResetResponse,
  type ResetPasswordResponse,
  type ResendVerificationCodeResponse,
  type StoredUser,
  type VerifyPasswordResetCodeResponse,
  type VerifyEmailResponse,
} from './types';
import { JwtService } from './jwt.service';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { UsersRepository } from './users.repository';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minPasswordLength = 8;
const verificationCodePattern = /^\d{6}$/;
const resetTokenTtlMinutes = 15;
const refreshTokenTtlDays = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly pendingRegistrationsRepository: PendingRegistrationsRepository,
    private readonly passwordResetRequestsRepository: PasswordResetRequestsRepository,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginUserDto: LoginUserDto): Promise<LoginUserResponse> {
    const email = loginUserDto.email?.trim().toLowerCase() ?? '';
    const password = loginUserDto.password ?? '';

    if (!emailPattern.test(email) || password.length === 0) {
      throw new BadRequestException('Email and password are required.');
    }

    const user = await this.usersRepository.findByEmail(email);

    if (!user || !this.isPasswordValid(password, user)) {
      throw new UnauthorizedException('Email or password is invalid.');
    }

    return this.toAuthSession(this.toAuthUser(user));
  }

  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<RegisterUserResponse> {
    const email = registerUserDto.email?.trim().toLowerCase() ?? '';
    const password = registerUserDto.password ?? '';
    const passwordConfirmation = registerUserDto.passwordConfirmation ?? '';

    if (!emailPattern.test(email)) {
      throw new BadRequestException('Email is invalid.');
    }

    if (password.length < minPasswordLength) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }

    if (password !== passwordConfirmation) {
      throw new BadRequestException('Passwords do not match.');
    }

    const existingUser = await this.usersRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    await this.pendingRegistrationsRepository.deleteByEmail(email);

    const verificationCode =
      this.emailVerificationService.createVerificationCode();
    const registration = this.createPendingRegistration(
      email,
      password,
      verificationCode.hash,
      verificationCode.salt,
      verificationCode.expiresAt,
    );

    await this.pendingRegistrationsRepository.create(registration);
    await this.emailVerificationService.sendVerificationCode(
      email,
      verificationCode.code,
    );

    return {
      email,
      verificationExpiresAt: verificationCode.expiresAt,
    };
  }

  async resendVerificationCode(
    resendVerificationCodeDto: ResendVerificationCodeDto,
  ): Promise<ResendVerificationCodeResponse> {
    const email = resendVerificationCodeDto.email?.trim().toLowerCase() ?? '';

    if (!emailPattern.test(email)) {
      throw new BadRequestException('Email is invalid.');
    }

    const existingUser = await this.usersRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const registration =
      await this.pendingRegistrationsRepository.findByEmail(email);

    if (!registration) {
      throw new BadRequestException('No pending registration found.');
    }

    const verificationCode =
      this.emailVerificationService.createVerificationCode();

    await this.pendingRegistrationsRepository.updateVerificationCode(
      email,
      verificationCode.hash,
      verificationCode.salt,
      verificationCode.expiresAt,
    );
    await this.emailVerificationService.sendVerificationCode(
      email,
      verificationCode.code,
    );

    return {
      email,
      verificationExpiresAt: verificationCode.expiresAt,
    };
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<VerifyEmailResponse> {
    const email = verifyEmailDto.email?.trim().toLowerCase() ?? '';
    const code = verifyEmailDto.code?.trim() ?? '';

    if (!emailPattern.test(email) || !verificationCodePattern.test(code)) {
      throw new BadRequestException('Verification code is invalid.');
    }

    const existingUser = await this.usersRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const registration =
      await this.pendingRegistrationsRepository.findByEmail(email);

    if (!registration) {
      throw new BadRequestException('No pending registration found.');
    }

    if (new Date(registration.verificationExpiresAt).getTime() < Date.now()) {
      throw new BadRequestException('Verification code has expired.');
    }

    const isCodeValid = this.emailVerificationService.isCodeValid(
      code,
      registration.verificationCodeHash,
      registration.verificationCodeSalt,
    );

    if (!isCodeValid) {
      throw new BadRequestException('Verification code is invalid.');
    }

    const user = this.createStoredUserFromPendingRegistration(registration);

    const createdUser = await this.usersRepository.create(user);
    await this.pendingRegistrationsRepository.deleteByEmail(email);

    return this.toAuthSession(this.toAuthUser(createdUser));
  }

  async loginWithGoogle(
    googleLoginDto: GoogleLoginDto,
  ): Promise<LoginUserResponse> {
    const idToken = googleLoginDto.idToken?.trim() ?? '';

    if (!idToken) {
      throw new BadRequestException('Google id token is required.');
    }

    const googleUser = await this.verifyGoogleIdToken(idToken);
    const email = googleUser.email.trim().toLowerCase();
    let user = await this.usersRepository.findByEmail(email);

    if (!user) {
      user = await this.usersRepository.create(
        this.createGoogleStoredUser(email),
      );
    }

    return this.toAuthSession(this.toAuthUser(user));
  }

  async refreshSession(
    refreshSessionDto: RefreshSessionDto,
  ): Promise<LoginUserResponse> {
    const refreshToken = refreshSessionDto.refreshToken?.trim() ?? '';

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const activeRefreshTokens =
      await this.refreshTokensRepository.findActiveByUserId(
        this.getRefreshTokenUserId(refreshToken),
      );
    const matchingRefreshToken = activeRefreshTokens.find((record) =>
      this.isSecretValid(refreshToken, record.tokenHash, record.tokenSalt),
    );

    if (!matchingRefreshToken) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    const user = await this.usersRepository.findById(
      matchingRefreshToken.userId,
    );

    if (!user) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    await this.refreshTokensRepository.revoke(matchingRefreshToken.id);

    return this.toAuthSession(this.toAuthUser(user));
  }

  async requestPasswordReset(
    requestPasswordResetDto: RequestPasswordResetDto,
  ): Promise<RequestPasswordResetResponse> {
    const email = requestPasswordResetDto.email?.trim().toLowerCase() ?? '';

    if (!emailPattern.test(email)) {
      throw new BadRequestException('Email is invalid.');
    }

    const user = await this.usersRepository.findByEmail(email);
    const verificationCode =
      this.emailVerificationService.createVerificationCode();

    if (!user) {
      return {
        email,
        verificationExpiresAt: verificationCode.expiresAt,
      };
    }

    await this.passwordResetRequestsRepository.upsert({
      createdAt: new Date().toISOString(),
      email,
      id: randomUUID(),
      resetTokenExpiresAt: null,
      resetTokenHash: null,
      resetTokenSalt: null,
      verificationCodeHash: verificationCode.hash,
      verificationCodeSalt: verificationCode.salt,
      verificationExpiresAt: verificationCode.expiresAt,
    });
    await this.emailVerificationService.sendPasswordResetCode(
      email,
      verificationCode.code,
    );

    return {
      email,
      verificationExpiresAt: verificationCode.expiresAt,
    };
  }

  async verifyPasswordResetCode(
    verifyPasswordResetCodeDto: VerifyPasswordResetCodeDto,
  ): Promise<VerifyPasswordResetCodeResponse> {
    const email = verifyPasswordResetCodeDto.email?.trim().toLowerCase() ?? '';
    const code = verifyPasswordResetCodeDto.code?.trim() ?? '';

    if (!emailPattern.test(email) || !verificationCodePattern.test(code)) {
      throw new BadRequestException('Verification code is invalid.');
    }

    const request =
      await this.passwordResetRequestsRepository.findByEmail(email);

    if (!request) {
      throw new BadRequestException('Verification code is invalid.');
    }

    if (new Date(request.verificationExpiresAt).getTime() < Date.now()) {
      throw new BadRequestException('Verification code has expired.');
    }

    const isCodeValid = this.emailVerificationService.isCodeValid(
      code,
      request.verificationCodeHash,
      request.verificationCodeSalt,
    );

    if (!isCodeValid) {
      throw new BadRequestException('Verification code is invalid.');
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenSalt = randomBytes(16).toString('hex');
    const resetTokenHash = this.hashSecret(resetToken, resetTokenSalt);
    const resetTokenExpiresAt = new Date(
      Date.now() + resetTokenTtlMinutes * 60 * 1000,
    ).toISOString();

    await this.passwordResetRequestsRepository.updateResetToken(
      email,
      resetTokenHash,
      resetTokenSalt,
      resetTokenExpiresAt,
    );

    return {
      email,
      resetToken,
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResponse> {
    const email = resetPasswordDto.email?.trim().toLowerCase() ?? '';
    const password = resetPasswordDto.password ?? '';
    const passwordConfirmation = resetPasswordDto.passwordConfirmation ?? '';
    const resetToken = resetPasswordDto.resetToken ?? '';

    if (!emailPattern.test(email) || resetToken.length === 0) {
      throw new BadRequestException('Password reset request is invalid.');
    }

    if (password.length < minPasswordLength) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }

    if (password !== passwordConfirmation) {
      throw new BadRequestException('Passwords do not match.');
    }

    const request =
      await this.passwordResetRequestsRepository.findByEmail(email);

    if (
      !request?.resetTokenHash ||
      !request.resetTokenSalt ||
      !request.resetTokenExpiresAt
    ) {
      throw new BadRequestException('Password reset request is invalid.');
    }

    if (new Date(request.resetTokenExpiresAt).getTime() < Date.now()) {
      throw new BadRequestException('Password reset request has expired.');
    }

    if (
      !this.isSecretValid(
        resetToken,
        request.resetTokenHash,
        request.resetTokenSalt,
      )
    ) {
      throw new BadRequestException('Password reset request is invalid.');
    }

    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Password reset request is invalid.');
    }

    const passwordCredentials = this.createPasswordCredentials(password);

    await this.usersRepository.updatePassword(
      email,
      passwordCredentials.passwordHash,
      passwordCredentials.passwordSalt,
    );
    await this.passwordResetRequestsRepository.deleteByEmail(email);

    return { email };
  }

  private isPasswordValid(password: string, user: StoredUser): boolean {
    return this.isSecretValid(password, user.passwordHash, user.passwordSalt);
  }

  private isSecretValid(secret: string, hash: string, salt: string): boolean {
    const expectedHash = Buffer.from(hash, 'hex');
    const actualHash = Buffer.from(this.hashSecret(secret, salt), 'hex');

    return (
      expectedHash.length === actualHash.length &&
      timingSafeEqual(expectedHash, actualHash)
    );
  }

  private createPendingRegistration(
    email: string,
    password: string,
    verificationCodeHash: string,
    verificationCodeSalt: string,
    verificationExpiresAt: string,
  ): PendingUserRegistration {
    const passwordCredentials = this.createPasswordCredentials(password);

    return {
      createdAt: new Date().toISOString(),
      email,
      id: randomUUID(),
      passwordHash: passwordCredentials.passwordHash,
      passwordSalt: passwordCredentials.passwordSalt,
      verificationCodeHash,
      verificationCodeSalt,
      verificationExpiresAt,
    };
  }

  private createStoredUserFromPendingRegistration(
    registration: PendingUserRegistration,
  ): StoredUser {
    return {
      balance: 0,
      createdAt: new Date().toISOString(),
      email: registration.email,
      id: randomUUID(),
      lessonsCompleted: 0,
      passwordHash: registration.passwordHash,
      passwordSalt: registration.passwordSalt,
      testsCompleted: 0,
      wordsLearned: 0,
    };
  }

  private toAuthUser(user: StoredUser): AuthUser {
    return {
      balance: user.balance,
      createdAt: user.createdAt,
      email: user.email,
      id: user.id,
      lessonsCompleted: user.lessonsCompleted,
      testsCompleted: user.testsCompleted,
      wordsLearned: user.wordsLearned,
    };
  }

  private async toAuthSession(user: AuthUser): Promise<LoginUserResponse> {
    const refreshToken = this.createRefreshToken(user.id);
    const refreshTokenSalt = randomBytes(16).toString('hex');
    const refreshTokenExpiresAt = new Date(
      Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    await this.refreshTokensRepository.create({
      createdAt: new Date().toISOString(),
      expiresAt: refreshTokenExpiresAt,
      id: randomUUID(),
      revokedAt: null,
      tokenHash: this.hashSecret(refreshToken, refreshTokenSalt),
      tokenSalt: refreshTokenSalt,
      userId: user.id,
    });

    return {
      ...this.jwtService.issueAccessToken(user),
      refreshToken,
      refreshTokenExpiresAt,
      user,
    };
  }

  private createRefreshToken(userId: string): string {
    return `${userId}.${randomBytes(48).toString('base64url')}`;
  }

  private getRefreshTokenUserId(refreshToken: string): string {
    const [userId] = refreshToken.split('.');

    if (!userId) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    return userId;
  }

  private createGoogleStoredUser(email: string): StoredUser {
    const passwordCredentials = this.createPasswordCredentials(
      randomBytes(32).toString('hex'),
    );

    return {
      balance: 0,
      createdAt: new Date().toISOString(),
      email,
      id: randomUUID(),
      lessonsCompleted: 0,
      passwordHash: passwordCredentials.passwordHash,
      passwordSalt: passwordCredentials.passwordSalt,
      testsCompleted: 0,
      wordsLearned: 0,
    };
  }

  private async verifyGoogleIdToken(
    idToken: string,
  ): Promise<{ email: string }> {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );

    if (!response.ok) {
      throw new UnauthorizedException('Google id token is invalid.');
    }

    const payload = (await response.json()) as {
      aud?: string;
      email?: string;
      email_verified?: string;
    };
    const expectedAudience = process.env.GOOGLE_WEB_CLIENT_ID?.trim();

    if (expectedAudience && payload.aud !== expectedAudience) {
      throw new UnauthorizedException('Google id token audience is invalid.');
    }

    if (payload.email_verified !== 'true' || !payload.email) {
      throw new UnauthorizedException('Google email is not verified.');
    }

    return { email: payload.email };
  }

  private createPasswordCredentials(password: string): {
    passwordHash: string;
    passwordSalt: string;
  } {
    const passwordSalt = randomBytes(16).toString('hex');

    return {
      passwordHash: this.hashSecret(password, passwordSalt),
      passwordSalt,
    };
  }

  private hashSecret(secret: string, salt: string): string {
    return pbkdf2Sync(secret, salt, 100_000, 64, 'sha512').toString('hex');
  }
}
