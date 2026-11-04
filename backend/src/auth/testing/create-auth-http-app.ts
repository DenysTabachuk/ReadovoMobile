import { HttpService } from '@nestjs/axios';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { pbkdf2Sync } from 'node:crypto';
import { type Server } from 'node:http';

import { configureApiBoundaries } from '../../common/configure-api-boundaries';
import { AuthModule } from '../auth.module';
import { EmailVerificationService } from '../email-verification.service';
import { PasswordResetRequestsRepository } from '../password-reset-requests.repository';
import { PendingRegistrationsRepository } from '../pending-registrations.repository';
import { RefreshTokensRepository } from '../refresh-tokens.repository';
import {
  type PasswordResetRequest,
  type PendingUserRegistration,
  type RefreshTokenRecord,
  type StoredUser,
} from '../types';
import { UsersRepository } from '../users.repository';

export const AUTH_TEST_NOW = '2026-11-03T12:00:00.000Z';
export const AUTH_TEST_EMAIL = 'reader@example.test';
export const AUTH_TEST_PASSWORD = 'test-password-123';
export const AUTH_TEST_CODE = '012345';
export const AUTH_TEST_RESET_TOKEN = 'a'.repeat(64);

/**
 * Creates a real auth-module HTTP app with fresh persistence/mail/provider mocks.
 * @returns App/server, independent fixtures, typed repository mocks, mail spies
 * and an Axios adapter that rejects unexpected network calls. Hashing, DTOs,
 * credential decisions, session creation and JWT issuance remain real. Callers
 * control the clock/environment and must close the app and restore their spies.
 * No database, live mail or provider calls are made.
 * @example
 * const testApp = await createAuthHttpApp();
 * testApp.users.findByEmail.mockResolvedValue(testApp.user);
 * // POST /auth/login with AUTH_TEST_PASSWORD now returns a real session.
 * await testApp.app.close();
 */
export async function createAuthHttpApp() {
  const salt = 'auth-http-fixture-salt';
  const user: StoredUser = {
    id: '11111111-1111-4111-8111-111111111111',
    email: AUTH_TEST_EMAIL,
    passwordHash: pbkdf2Sync(
      AUTH_TEST_PASSWORD,
      salt,
      100_000,
      64,
      'sha512',
    ).toString('hex'),
    passwordSalt: salt,
    createdAt: '2026-10-01T12:00:00.000Z',
    balance: 25,
    testsCompleted: 2,
    wordsLearned: 3,
    lessonsCompleted: 1,
  };
  const pending: PendingUserRegistration = {
    id: '22222222-2222-4222-8222-222222222222',
    email: AUTH_TEST_EMAIL,
    passwordHash: user.passwordHash,
    passwordSalt: salt,
    verificationCodeHash: pbkdf2Sync(
      AUTH_TEST_CODE,
      salt,
      100_000,
      64,
      'sha512',
    ).toString('hex'),
    verificationCodeSalt: salt,
    verificationExpiresAt: '2026-11-03T12:15:00.000Z',
    createdAt: AUTH_TEST_NOW,
  };
  const reset: PasswordResetRequest = {
    ...pending,
    resetTokenHash: pbkdf2Sync(
      AUTH_TEST_RESET_TOKEN,
      salt,
      100_000,
      64,
      'sha512',
    ).toString('hex'),
    resetTokenSalt: salt,
    resetTokenExpiresAt: '2026-11-03T12:15:00.000Z',
  };
  const refreshToken = `${user.id}.test-refresh-secret`;
  const refreshRecord: RefreshTokenRecord = {
    id: '33333333-3333-4333-8333-333333333333',
    userId: user.id,
    createdAt: AUTH_TEST_NOW,
    expiresAt: '2026-12-03T12:00:00.000Z',
    revokedAt: null,
    tokenSalt: salt,
    tokenHash: pbkdf2Sync(refreshToken, salt, 100_000, 64, 'sha512').toString(
      'hex',
    ),
  };
  const users: jest.Mocked<
    Pick<
      UsersRepository,
      'findByEmail' | 'findById' | 'create' | 'updatePassword'
    >
  > = {
    findByEmail: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn().mockResolvedValue(undefined),
    create: jest
      .fn()
      .mockImplementation((record: StoredUser) => Promise.resolve(record)),
    updatePassword: jest.fn().mockResolvedValue(undefined),
  };
  const registrations: jest.Mocked<
    Pick<
      PendingRegistrationsRepository,
      'create' | 'deleteByEmail' | 'findByEmail' | 'updateVerificationCode'
    >
  > = {
    create: jest
      .fn()
      .mockImplementation((record: PendingUserRegistration) =>
        Promise.resolve(record),
      ),
    deleteByEmail: jest.fn().mockResolvedValue(undefined),
    findByEmail: jest.fn().mockResolvedValue(undefined),
    updateVerificationCode: jest.fn().mockResolvedValue(undefined),
  };
  const resets: jest.Mocked<
    Pick<
      PasswordResetRequestsRepository,
      'upsert' | 'deleteByEmail' | 'findByEmail' | 'updateResetToken'
    >
  > = {
    upsert: jest
      .fn()
      .mockImplementation((record: PasswordResetRequest) =>
        Promise.resolve(record),
      ),
    deleteByEmail: jest.fn().mockResolvedValue(undefined),
    findByEmail: jest.fn().mockResolvedValue(undefined),
    updateResetToken: jest.fn().mockResolvedValue(undefined),
  };
  const refreshTokens: jest.Mocked<
    Pick<RefreshTokensRepository, 'create' | 'findActiveByUserId' | 'revoke'>
  > = {
    create: jest.fn().mockResolvedValue(undefined),
    findActiveByUserId: jest.fn().mockResolvedValue([]),
    revoke: jest.fn().mockResolvedValue(undefined),
  };
  const module = await Test.createTestingModule({ imports: [AuthModule] })
    .overrideProvider(UsersRepository)
    .useValue(users)
    .overrideProvider(PendingRegistrationsRepository)
    .useValue(registrations)
    .overrideProvider(PasswordResetRequestsRepository)
    .useValue(resets)
    .overrideProvider(RefreshTokensRepository)
    .useValue(refreshTokens)
    .compile();
  const mail = module.get(EmailVerificationService);
  const sendVerificationCode = jest
    .spyOn(mail, 'sendVerificationCode')
    .mockResolvedValue();
  const sendPasswordResetCode = jest
    .spyOn(mail, 'sendPasswordResetCode')
    .mockResolvedValue();
  const adapter = jest
    .fn<Promise<AxiosResponse<unknown>>, [InternalAxiosRequestConfig]>()
    .mockRejectedValue(new Error('Unexpected external HTTP request'));
  module.get(HttpService).axiosRef.defaults.adapter = adapter;
  const app = module.createNestApplication<INestApplication<Server>>({
    bodyParser: false,
    logger: false,
  });
  configureApiBoundaries(app);
  try {
    await app.init();
  } catch (error) {
    await app.close();
    throw error;
  }
  return {
    app,
    server: app.getHttpServer(),
    user,
    pending,
    reset,
    refreshToken,
    refreshRecord,
    users,
    registrations,
    resets,
    refreshTokens,
    adapter,
    sendVerificationCode,
    sendPasswordResetCode,
  };
}

export type AuthHttpTestApp = Awaited<ReturnType<typeof createAuthHttpApp>>;
