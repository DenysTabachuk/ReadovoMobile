import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { pbkdf2Sync } from 'node:crypto';

import { AuthService } from './auth.service';
import { type StoredUser } from './types';
import { UsersRepository } from './users.repository';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<
    Pick<UsersRepository, 'create' | 'findByEmail'>
  >;

  beforeEach(async () => {
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
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('registers a user with normalized email and hashed password', async () => {
    usersRepository.findByEmail.mockResolvedValue(undefined);
    usersRepository.create.mockImplementation((user) => Promise.resolve(user));

    const response = await service.register({
      email: ' New.User@Example.com ',
      password: 'password123',
      passwordConfirmation: 'password123',
    });

    expect(usersRepository.findByEmail).toHaveBeenCalledWith(
      'new.user@example.com',
    );
    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new.user@example.com',
        passwordSalt: expect.any(String) as string,
        passwordHash: expect.any(String) as string,
      }),
    );
    expect(response.user).toEqual(
      expect.objectContaining({
        email: 'new.user@example.com',
        id: expect.any(String) as string,
      }),
    );
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
      createdAt: user.createdAt,
      email: user.email,
      id: user.id,
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
    usersRepository.findByEmail.mockResolvedValue({
      email: 'user@example.com',
    } as StoredUser);

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
    createdAt: '2026-04-22T00:00:00.000Z',
    email,
    id: 'test-user-id',
    passwordHash,
    passwordSalt,
  };
}
