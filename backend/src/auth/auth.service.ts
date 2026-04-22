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
import {
  type AuthUser,
  type LoginUserResponse,
  type RegisterUserResponse,
  type StoredUser,
} from './types';
import { UsersRepository } from './users.repository';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minPasswordLength = 8;

@Injectable()
export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

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

    const user = this.createStoredUser(email, password);

    await this.usersRepository.create(user);

    return {
      user: this.toAuthUser(user),
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

  private createStoredUser(email: string, password: string): StoredUser {
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
    };
  }

  private toAuthUser(user: StoredUser): AuthUser {
    return {
      createdAt: user.createdAt,
      email: user.email,
      id: user.id,
    };
  }
}
