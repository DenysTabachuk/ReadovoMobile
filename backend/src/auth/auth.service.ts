import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import {
  pbkdf2Sync,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';

import { ApiException } from '../common/errors/api-exception';
import { COMMON_ERRORS } from '../common/errors/common-errors';
import { mapProviderError } from '../http/map-provider-error';

import { AUTH_ERRORS } from './auth-errors';
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
    private readonly http: HttpService,
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
      throw new ApiException(COMMON_ERRORS.VALIDATION_FAILED, { fields: [] });
    }

    const user = await this.usersRepository.findByEmail(email);

    if (!user || !this.isPasswordValid(password, user)) {
      throw new ApiException(AUTH_ERRORS.CREDENTIALS_INVALID);
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
      throw new ApiException(COMMON_ERRORS.VALIDATION_FAILED, {
        fields: [{ path: ['email'], rule: 'EMAIL_INVALID' }],
      });
    }

    if (password.length < minPasswordLength) {
      throw new ApiException(COMMON_ERRORS.VALIDATION_FAILED, {
        fields: [{ path: ['password'], rule: 'STRING_TOO_SHORT' }],
      });
    }

    if (password !== passwordConfirmation) {
      throw new ApiException(COMMON_ERRORS.VALIDATION_FAILED, {
        fields: [
          { path: ['passwordConfirmation'], rule: 'FIELDS_DO_NOT_MATCH' },
        ],
      });
    }

    const existingUser = await this.usersRepository.findByEmail(email);

    if (existingUser) {
      throw new ApiException(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
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
      throw new ApiException(COMMON_ERRORS.VALIDATION_FAILED, {
        fields: [{ path: ['email'], rule: 'EMAIL_INVALID' }],
      });
    }

    const existingUser = await this.usersRepository.findByEmail(email);

    if (existingUser) {
      throw new ApiException(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
    }

    const registration =
      await this.pendingRegistrationsRepository.findByEmail(email);

    if (!registration) {
      throw new ApiException(AUTH_ERRORS.REGISTRATION_NOT_PENDING);
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
      throw new ApiException(AUTH_ERRORS.VERIFICATION_CODE_INVALID);
    }

    const existingUser = await this.usersRepository.findByEmail(email);

    if (existingUser) {
      throw new ApiException(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
    }

    const registration =
      await this.pendingRegistrationsRepository.findByEmail(email);

    if (!registration) {
      throw new ApiException(AUTH_ERRORS.REGISTRATION_NOT_PENDING);
    }

    if (new Date(registration.verificationExpiresAt).getTime() < Date.now()) {
      throw new ApiException(AUTH_ERRORS.VERIFICATION_CODE_EXPIRED);
    }

    const isCodeValid = this.emailVerificationService.isCodeValid(
      code,
      registration.verificationCodeHash,
      registration.verificationCodeSalt,
    );

    if (!isCodeValid) {
      throw new ApiException(AUTH_ERRORS.VERIFICATION_CODE_INVALID);
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
      throw new ApiException(COMMON_ERRORS.VALIDATION_FAILED, {
        fields: [{ path: ['idToken'], rule: 'VALUE_REQUIRED' }],
      });
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
      throw new ApiException(AUTH_ERRORS.REFRESH_REJECTED);
    }

    const activeRefreshTokens =
      await this.refreshTokensRepository.findActiveByUserId(
        this.getRefreshTokenUserId(refreshToken),
      );
    const matchingRefreshToken = activeRefreshTokens.find((record) =>
      this.isSecretValid(refreshToken, record.tokenHash, record.tokenSalt),
    );

    if (!matchingRefreshToken) {
      throw new ApiException(AUTH_ERRORS.REFRESH_REJECTED);
    }

    const user = await this.usersRepository.findById(
      matchingRefreshToken.userId,
    );

    if (!user) {
      throw new ApiException(AUTH_ERRORS.REFRESH_REJECTED);
    }

    await this.refreshTokensRepository.revoke(matchingRefreshToken.id);

    return this.toAuthSession(this.toAuthUser(user));
  }

  async requestPasswordReset(
    requestPasswordResetDto: RequestPasswordResetDto,
  ): Promise<RequestPasswordResetResponse> {
    const email = requestPasswordResetDto.email?.trim().toLowerCase() ?? '';

    if (!emailPattern.test(email)) {
      throw new ApiException(COMMON_ERRORS.VALIDATION_FAILED, {
        fields: [{ path: ['email'], rule: 'EMAIL_INVALID' }],
      });
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
      throw new ApiException(AUTH_ERRORS.RESET_CODE_INVALID);
    }

    const request =
      await this.passwordResetRequestsRepository.findByEmail(email);

    if (!request) {
      throw new ApiException(AUTH_ERRORS.RESET_CODE_INVALID);
    }

    if (new Date(request.verificationExpiresAt).getTime() < Date.now()) {
      throw new ApiException(AUTH_ERRORS.RESET_CODE_EXPIRED);
    }

    const isCodeValid = this.emailVerificationService.isCodeValid(
      code,
      request.verificationCodeHash,
      request.verificationCodeSalt,
    );

    if (!isCodeValid) {
      throw new ApiException(AUTH_ERRORS.RESET_CODE_INVALID);
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
      throw new ApiException(AUTH_ERRORS.RESET_REQUEST_INVALID);
    }

    if (password.length < minPasswordLength) {
      throw new ApiException(COMMON_ERRORS.VALIDATION_FAILED, {
        fields: [{ path: ['password'], rule: 'STRING_TOO_SHORT' }],
      });
    }

    if (password !== passwordConfirmation) {
      throw new ApiException(COMMON_ERRORS.VALIDATION_FAILED, {
        fields: [
          { path: ['passwordConfirmation'], rule: 'FIELDS_DO_NOT_MATCH' },
        ],
      });
    }

    const request =
      await this.passwordResetRequestsRepository.findByEmail(email);

    if (
      !request?.resetTokenHash ||
      !request.resetTokenSalt ||
      !request.resetTokenExpiresAt
    ) {
      throw new ApiException(AUTH_ERRORS.RESET_REQUEST_INVALID);
    }

    if (new Date(request.resetTokenExpiresAt).getTime() < Date.now()) {
      throw new ApiException(AUTH_ERRORS.RESET_REQUEST_EXPIRED);
    }

    if (
      !this.isSecretValid(
        resetToken,
        request.resetTokenHash,
        request.resetTokenSalt,
      )
    ) {
      throw new ApiException(AUTH_ERRORS.RESET_REQUEST_INVALID);
    }

    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new ApiException(AUTH_ERRORS.RESET_REQUEST_INVALID);
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
      throw new ApiException(AUTH_ERRORS.REFRESH_REJECTED);
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

  /**
   * Checks the token with Google and reads a verified email from the response.
   * Identity rejection is a public 401; null data or a truthy non-string email
   * retains the existing 500 status with a safe application error.
   * Network failures propagate to the global filter without exposing their payload.
   */
  private async verifyGoogleIdToken(
    idToken: string,
  ): Promise<{ email: string }> {
    const response = await this.http
      .axiosRef(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      )
      .catch(
        mapProviderError(
          new ApiException(AUTH_ERRORS.GOOGLE_IDENTITY_REJECTED),
        ),
      );

    const payload: unknown = response.data;
    // Provider data is untrusted; malformed payloads must not leak as raw errors.
    if (payload === null || payload === undefined) {
      throw new ApiException(COMMON_ERRORS.INTERNAL_ERROR);
    }
    if (typeof payload !== 'object' || Array.isArray(payload)) {
      throw new ApiException(AUTH_ERRORS.GOOGLE_IDENTITY_REJECTED);
    }
    const expectedAudience = process.env.GOOGLE_WEB_CLIENT_ID?.trim();

    if (
      expectedAudience &&
      (!('aud' in payload) || payload.aud !== expectedAudience)
    ) {
      throw new ApiException(AUTH_ERRORS.GOOGLE_IDENTITY_REJECTED);
    }

    if (
      !('email_verified' in payload) ||
      payload.email_verified !== 'true' ||
      !('email' in payload) ||
      !payload.email
    ) {
      throw new ApiException(AUTH_ERRORS.GOOGLE_IDENTITY_REJECTED);
    }
    if (typeof payload.email !== 'string') {
      throw new ApiException(COMMON_ERRORS.INTERNAL_ERROR);
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
