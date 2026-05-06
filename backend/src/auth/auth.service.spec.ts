import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { pbkdf2Sync } from 'node:crypto';

import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { PendingRegistrationsRepository } from './pending-registrations.repository';
import { type PendingUserRegistration, type StoredUser } from './types';
import { UsersRepository } from './users.repository';

describe('AuthService', () => {
  let service: AuthService;
  let emailVerificationService: jest.Mocked<
    Pick<
      EmailVerificationService,
      'createVerificationCode' | 'isCodeValid' | 'sendVerificationCode'
    >
  >;
  let pendingRegistrationsRepository: jest.Mocked<
    Pick<
      PendingRegistrationsRepository,
      'create' | 'deleteByEmail' | 'findByEmail' | 'updateVerificationCode'
    >
  >;
  let usersRepository: jest.Mocked<
    Pick<UsersRepository, 'create' | 'findByEmail'>
  >;

  beforeEach(async () => {
    emailVerificationService = {
      createVerificationCode: jest.fn().mockReturnValue({
        code: '123456',
        expiresAt: '2026-04-22T00:15:00.000Z',
        hash: 'verification-code-hash',
        salt: 'verification-code-salt',
      }),
      isCodeValid: jest.fn(),
      sendVerificationCode: jest.fn().mockResolvedValue(undefined),
    };
    pendingRegistrationsRepository = {
      create: jest.fn(),
      deleteByEmail: jest.fn().mockResolvedValue(undefined),
      findByEmail: jest.fn(),
      updateVerificationCode: jest.fn().mockResolvedValue(undefined),
    };
    usersRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: usersRepository,
        },
        {
          provide: PendingRegistrationsRepository,
          useValue: pendingRegistrationsRepository,
        },
        {
          provide: EmailVerificationService,
          useValue: emailVerificationService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('creates a pending registration with normalized email and hashed password', async () => {
    usersRepository.findByEmail.mockResolvedValue(undefined);
    pendingRegistrationsRepository.create.mockImplementation((registration) =>
      Promise.resolve(registration),
    );

    const response = await service.register({
      email: ' New.User@Example.com ',
      password: 'password123',
      passwordConfirmation: 'password123',
    });

    expect(usersRepository.findByEmail).toHaveBeenCalledWith(
      'new.user@example.com',
    );
    expect(pendingRegistrationsRepository.deleteByEmail).toHaveBeenCalledWith(
      'new.user@example.com',
    );
    expect(pendingRegistrationsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new.user@example.com',
        passwordSalt: expect.any(String) as string,
        passwordHash: expect.any(String) as string,
        verificationCodeHash: 'verification-code-hash',
        verificationCodeSalt: 'verification-code-salt',
      }),
    );
    expect(emailVerificationService.sendVerificationCode).toHaveBeenCalledWith(
      'new.user@example.com',
      '123456',
    );
    expect(response).toEqual({
      email: 'new.user@example.com',
      verificationExpiresAt: '2026-04-22T00:15:00.000Z',
    });
  });

  it('verifies email and creates the user', async () => {
    const registration = createPendingRegistration('user@example.com');

    usersRepository.findByEmail.mockResolvedValue(undefined);
    pendingRegistrationsRepository.findByEmail.mockResolvedValue(registration);
    emailVerificationService.isCodeValid.mockReturnValue(true);
    usersRepository.create.mockImplementation((user) => Promise.resolve(user));

    const response = await service.verifyEmail({
      code: '123456',
      email: ' User@Example.com ',
    });

    expect(emailVerificationService.isCodeValid).toHaveBeenCalledWith(
      '123456',
      registration.verificationCodeHash,
      registration.verificationCodeSalt,
    );
    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        passwordHash: registration.passwordHash,
        passwordSalt: registration.passwordSalt,
      }),
    );
    expect(pendingRegistrationsRepository.deleteByEmail).toHaveBeenCalledWith(
      'user@example.com',
    );
    expect(response.user.email).toBe('user@example.com');
    expect(response.user).not.toHaveProperty('passwordHash');
  });

  it('logs in a user with normalized email and valid password', async () => {
    const user = createStoredUser('user@example.com', 'password123');

    usersRepository.findByEmail.mockResolvedValue(user);

    const response = await service.login({
      email: ' User@Example.com ',
      password: 'password123',
    });

    expect(usersRepository.findByEmail).toHaveBeenCalledWith(
      'user@example.com',
    );
    expect(response.user).toEqual({
      balance: user.balance,
      createdAt: user.createdAt,
      email: user.email,
      id: user.id,
      lessonsCompleted: user.lessonsCompleted,
      testsCompleted: user.testsCompleted,
      wordsLearned: user.wordsLearned,
    });
    expect(response.user).not.toHaveProperty('passwordHash');
  });

  it('rejects login with invalid password', async () => {
    usersRepository.findByEmail.mockResolvedValue(
      createStoredUser('user@example.com', 'password123'),
    );

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an already registered email', async () => {
    usersRepository.findByEmail.mockResolvedValue(
      createStoredUser('user@example.com', 'password123'),
    );

    await expect(
      service.register({
        email: 'user@example.com',
        password: 'password123',
        passwordConfirmation: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects passwords shorter than 8 characters', async () => {
    await expect(
      service.register({
        email: 'user@example.com',
        password: 'short',
        passwordConfirmation: 'short',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an expired verification code', async () => {
    usersRepository.findByEmail.mockResolvedValue(undefined);
    pendingRegistrationsRepository.findByEmail.mockResolvedValue({
      ...createPendingRegistration('user@example.com'),
      verificationExpiresAt: '2020-01-01T00:00:00.000Z',
    });

    await expect(
      service.verifyEmail({
        code: '123456',
        email: 'user@example.com',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function createStoredUser(email: string, password: string): StoredUser {
  const passwordSalt = 'test-salt';
  const passwordHash = pbkdf2Sync(
    password,
    passwordSalt,
    100_000,
    64,
    'sha512',
  ).toString('hex');

  return {
    balance: 0,
    createdAt: '2026-04-22T00:00:00.000Z',
    email,
    id: 'test-user-id',
    lessonsCompleted: 0,
    passwordHash,
    passwordSalt,
    testsCompleted: 0,
    wordsLearned: 0,
  };
}

function createPendingRegistration(email: string): PendingUserRegistration {
  return {
    createdAt: '2026-04-22T00:00:00.000Z',
    email,
    id: 'test-pending-registration-id',
    passwordHash: 'pending-password-hash',
    passwordSalt: 'pending-password-salt',
    verificationCodeHash: 'verification-code-hash',
    verificationCodeSalt: 'verification-code-salt',
    verificationExpiresAt: '2099-04-22T00:15:00.000Z',
  };
}
