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
import { type ResendVerificationCodeDto } from './dto/resend-verification-code.dto';
import { type VerifyEmailDto } from './dto/verify-email.dto';
import { EmailVerificationService } from './email-verification.service';
import { PendingRegistrationsRepository } from './pending-registrations.repository';
import {
  type AuthUser,
  type LoginUserResponse,
  type PendingUserRegistration,
  type RegisterUserResponse,
  type ResendVerificationCodeResponse,
  type StoredUser,
  type VerifyEmailResponse,
} from './types';
import { UsersRepository } from './users.repository';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minPasswordLength = 8;
const verificationCodePattern = /^\d{6}$/;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly pendingRegistrationsRepository: PendingRegistrationsRepository,
    private readonly emailVerificationService: EmailVerificationService,
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

    return {
      user: this.toAuthUser(user),
    };
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

    return {
      user: this.toAuthUser(createdUser),
    };
  }

  private isPasswordValid(password: string, user: StoredUser): boolean {
    const passwordHash = pbkdf2Sync(
      password,
      user.passwordSalt,
      100_000,
      64,
      'sha512',
    ).toString('hex');
    const expectedHash = Buffer.from(user.passwordHash, 'hex');
    const actualHash = Buffer.from(passwordHash, 'hex');

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
    const passwordSalt = randomBytes(16).toString('hex');
    const passwordHash = pbkdf2Sync(
      password,
      passwordSalt,
      100_000,
      64,
      'sha512',
    ).toString('hex');

    return {
      createdAt: new Date().toISOString(),
      email,
      id: randomUUID(),
      passwordHash,
      passwordSalt,
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
}
