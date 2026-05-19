import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { pbkdf2Sync } from 'node:crypto';

import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { JwtService } from './jwt.service';
import { PendingRegistrationsRepository } from './pending-registrations.repository';
import { PasswordResetRequestsRepository } from './password-reset-requests.repository';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import {
  type PasswordResetRequest,
  type PendingUserRegistration,
  type StoredUser,
} from './types';
import { UsersRepository } from './users.repository';

describe('AuthService', () => {
  let service: AuthService;
  let emailVerificationService: jest.Mocked<
    Pick<
      EmailVerificationService,
      | 'createVerificationCode'
      | 'isCodeValid'
      | 'sendPasswordResetCode'
      | 'sendVerificationCode'
    >
  >;
  let pendingRegistrationsRepository: jest.Mocked<
    Pick<
      PendingRegistrationsRepository,
      'create' | 'deleteByEmail' | 'findByEmail' | 'updateVerificationCode'
    >
  >;
  let usersRepository: jest.Mocked<
    Pick<UsersRepository, 'create' | 'findByEmail' | 'findById' | 'updatePassword'>
  >;
  let refreshTokensRepository: jest.Mocked<
    Pick<RefreshTokensRepository, 'create' | 'findActiveByUserId' | 'revoke'>
  >;
  let passwordResetRequestsRepository: jest.Mocked<
    Pick<
      PasswordResetRequestsRepository,
      'deleteByEmail' | 'findByEmail' | 'updateResetToken' | 'upsert'
    >
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
      sendPasswordResetCode: jest.fn().mockResolvedValue(undefined),
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
      findById: jest.fn(),
      updatePassword: jest.fn().mockResolvedValue(undefined),
    };
    refreshTokensRepository = {
      create: jest.fn().mockResolvedValue(undefined),
      findActiveByUserId: jest.fn(),
      revoke: jest.fn().mockResolvedValue(undefined),
    };
    passwordResetRequestsRepository = {
      deleteByEmail: jest.fn().mockResolvedValue(undefined),
      findByEmail: jest.fn(),
      updateResetToken: jest.fn().mockResolvedValue(undefined),
      upsert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: UsersRepository,
          useValue: usersRepository,
        },
        {
          provide: PendingRegistrationsRepository,
          useValue: pendingRegistrationsRepository,
        },
        {
          provide: PasswordResetRequestsRepository,
          useValue: passwordResetRequestsRepository,
        },
        {
          provide: RefreshTokensRepository,
          useValue: refreshTokensRepository,
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
    expect(response.accessToken).toEqual(expect.any(String));
    expect(response.accessTokenExpiresAt).toEqual(expect.any(String));
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
    expect(response.accessToken).toEqual(expect.any(String));
    expect(response.accessTokenExpiresAt).toEqual(expect.any(String));
  });

  it('refreshes a session and rotates the refresh token', async () => {
    const user = createStoredUser('user@example.com', 'password123');

    usersRepository.findByEmail.mockResolvedValue(user);
    usersRepository.findById.mockResolvedValue(user);

    const loginResponse = await service.login({
      email: 'user@example.com',
      password: 'password123',
    });
    const refreshTokenRecord =
      refreshTokensRepository.create.mock.calls[0]?.[0];

    expect(refreshTokenRecord).toBeDefined();
    if (!refreshTokenRecord) {
      throw new Error('Expected refresh token record to be created.');
    }

    refreshTokensRepository.findActiveByUserId.mockResolvedValue([
      refreshTokenRecord,
    ]);

    const refreshResponse = await service.refreshSession({
      refreshToken: loginResponse.refreshToken,
    });

    expect(refreshTokensRepository.findActiveByUserId).toHaveBeenCalledWith(
      user.id,
    );
    expect(refreshTokensRepository.revoke).toHaveBeenCalledWith(
      refreshTokenRecord.id,
    );
    expect(refreshResponse.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.refreshToken).toEqual(expect.any(String));
    expect(refreshResponse.refreshToken).not.toBe(loginResponse.refreshToken);
    expect(refreshTokensRepository.create).toHaveBeenCalledTimes(2);
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

  it('requests password reset without revealing missing accounts', async () => {
    usersRepository.findByEmail.mockResolvedValue(undefined);

    const response = await service.requestPasswordReset({
      email: ' Missing@Example.com ',
    });

    expect(response).toEqual({
      email: 'missing@example.com',
      verificationExpiresAt: '2026-04-22T00:15:00.000Z',
    });
    expect(passwordResetRequestsRepository.upsert).not.toHaveBeenCalled();
    expect(
      emailVerificationService.sendPasswordResetCode,
    ).not.toHaveBeenCalled();
  });

  it('sends a password reset code for an existing account', async () => {
    usersRepository.findByEmail.mockResolvedValue(
      createStoredUser('user@example.com', 'password123'),
    );
    passwordResetRequestsRepository.upsert.mockImplementation((request) =>
      Promise.resolve(request),
    );

    await service.requestPasswordReset({
      email: ' User@Example.com ',
    });

    expect(passwordResetRequestsRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        verificationCodeHash: 'verification-code-hash',
        verificationCodeSalt: 'verification-code-salt',
      }),
    );
    expect(emailVerificationService.sendPasswordResetCode).toHaveBeenCalledWith(
      'user@example.com',
      '123456',
    );
  });

  it('verifies a password reset code and returns a reset token', async () => {
    const request = createPasswordResetRequest('user@example.com');

    passwordResetRequestsRepository.findByEmail.mockResolvedValue(request);
    emailVerificationService.isCodeValid.mockReturnValue(true);

    const response = await service.verifyPasswordResetCode({
      code: '123456',
      email: ' User@Example.com ',
    });

    expect(emailVerificationService.isCodeValid).toHaveBeenCalledWith(
      '123456',
      request.verificationCodeHash,
      request.verificationCodeSalt,
    );
    expect(
      passwordResetRequestsRepository.updateResetToken,
    ).toHaveBeenCalledWith(
      'user@example.com',
      expect.any(String),
      expect.any(String),
      expect.any(String),
    );
    expect(response.email).toBe('user@example.com');
    expect(response.resetToken).toEqual(expect.any(String));
  });

  it('resets password with a valid reset token', async () => {
    const resetToken = 'reset-token';
    const resetTokenSalt = 'reset-token-salt';
    const request = {
      ...createPasswordResetRequest('user@example.com'),
      resetTokenExpiresAt: '2099-04-22T00:15:00.000Z',
      resetTokenHash: pbkdf2Sync(
        resetToken,
        resetTokenSalt,
        100_000,
        64,
        'sha512',
      ).toString('hex'),
      resetTokenSalt,
    };

    passwordResetRequestsRepository.findByEmail.mockResolvedValue(request);
    usersRepository.findByEmail.mockResolvedValue(
      createStoredUser('user@example.com', 'password123'),
    );

    const response = await service.resetPassword({
      email: 'user@example.com',
      password: 'new-password123',
      passwordConfirmation: 'new-password123',
      resetToken,
    });

    expect(usersRepository.updatePassword).toHaveBeenCalledWith(
      'user@example.com',
      expect.any(String),
      expect.any(String),
    );
    expect(passwordResetRequestsRepository.deleteByEmail).toHaveBeenCalledWith(
      'user@example.com',
    );
    expect(response).toEqual({ email: 'user@example.com' });
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

function createPasswordResetRequest(email: string): PasswordResetRequest {
  return {
    createdAt: '2026-04-22T00:00:00.000Z',
    email,
    id: 'test-password-reset-request-id',
    resetTokenExpiresAt: null,
    resetTokenHash: null,
    resetTokenSalt: null,
    verificationCodeHash: 'verification-code-hash',
    verificationCodeSalt: 'verification-code-salt',
    verificationExpiresAt: '2099-04-22T00:15:00.000Z',
  };
}
