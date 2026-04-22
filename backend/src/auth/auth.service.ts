import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { pbkdf2Sync, randomBytes, randomUUID } from 'node:crypto';

import { type RegisterUserDto } from './dto/register-user.dto';
import {
  type AuthUser,
  type RegisterUserResponse,
  type StoredUser,
} from './types';
import { UsersRepository } from './users.repository';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minPasswordLength = 8;

@Injectable()
export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

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
