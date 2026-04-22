import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

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
