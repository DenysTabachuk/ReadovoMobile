import { HttpService } from '@nestjs/axios';
import {
  Controller,
  Get,
  type INestApplication,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHmac, pbkdf2Sync } from 'node:crypto';
import { type Server } from 'node:http';
import request from 'supertest';

import { configureApiBoundaries } from '../common/configure-api-boundaries';
import { ExternalHttpError } from '../http/external-http.error';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { EmailVerificationService } from './email-verification.service';
import { JwtService } from './jwt.service';
import { PasswordResetRequestsRepository } from './password-reset-requests.repository';
import { PendingRegistrationsRepository } from './pending-registrations.repository';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import {
  type AuthenticatedUser,
  type PasswordResetRequest,
  type PendingUserRegistration,
  type StoredUser,
} from './types';
import { UserAuthGuard } from './user-auth.guard';
import { UsersRepository } from './users.repository';

@Controller('auth-contract-test')
class IdentityController {
  @Get('users/:userId')
  @UseGuards(UserAuthGuard)
  identity(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Get('unguarded')
  unguarded(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}

const now = Date.parse('2026-10-28T12:00:00.000Z');
const future = '2030-01-01T00:00:00.000Z';
const past = '2020-01-01T00:00:00.000Z';
const email = 'user@example.com';
const password = 'password123';
const resetToken = 'a'.repeat(64);
const salt = 'test-salt';
const secret = 'auth-contract-test-secret';

const user: StoredUser = {
  id: '6cb17992-041b-42f8-a040-b05c2d4b6b2e',
  email,
  passwordHash: pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString(
    'hex',
  ),
  passwordSalt: salt,
  createdAt: past,
  balance: 0,
  lessonsCompleted: 0,
  testsCompleted: 0,
  wordsLearned: 0,
};
const pending: PendingUserRegistration = {
  id: 'pending-registration',
  email,
  passwordHash: user.passwordHash,
  passwordSalt: salt,
  verificationCodeHash: 'verification-hash',
  verificationCodeSalt: salt,
  verificationExpiresAt: future,
  createdAt: past,
};
const reset: PasswordResetRequest = {
  ...pending,
  resetTokenHash: pbkdf2Sync(resetToken, salt, 100_000, 64, 'sha512').toString(
    'hex',
  ),
  resetTokenSalt: salt,
  resetTokenExpiresAt: future,
};

describe('Auth error contract (HTTP)', () => {
  let app: INestApplication<Server>;
  let service: AuthService;
  let jwt: JwtService;
  let previousAudience: string | undefined;
  let previousSecret: string | undefined;
  const providerRequest = jest.fn();
  const users: jest.Mocked<
    Pick<
      UsersRepository,
      'findByEmail' | 'findById' | 'create' | 'updatePassword'
    >
  > = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
  };
  const registrations: jest.Mocked<
    Pick<
      PendingRegistrationsRepository,
      'findByEmail' | 'create' | 'deleteByEmail' | 'updateVerificationCode'
    >
  > = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    deleteByEmail: jest.fn(),
    updateVerificationCode: jest.fn(),
  };
  const resets: jest.Mocked<
    Pick<
      PasswordResetRequestsRepository,
      'findByEmail' | 'upsert' | 'deleteByEmail' | 'updateResetToken'
    >
  > = {
    findByEmail: jest.fn(),
    upsert: jest.fn(),
    deleteByEmail: jest.fn(),
    updateResetToken: jest.fn(),
  };
  const tokens: jest.Mocked<
    Pick<RefreshTokensRepository, 'findActiveByUserId' | 'create' | 'revoke'>
  > = {
    findActiveByUserId: jest.fn(),
    create: jest.fn(),
    revoke: jest.fn(),
  };
  const codes: jest.Mocked<
    Pick<
      EmailVerificationService,
      | 'createVerificationCode'
      | 'isCodeValid'
      | 'sendVerificationCode'
      | 'sendPasswordResetCode'
    >
  > = {
    createVerificationCode: jest.fn(),
    isCodeValid: jest.fn(),
    sendVerificationCode: jest.fn(),
    sendPasswordResetCode: jest.fn(),
  };

  beforeAll(async () => {
    previousAudience = process.env.GOOGLE_WEB_CLIENT_ID;
    previousSecret = process.env.JWT_SECRET;
    process.env.GOOGLE_WEB_CLIENT_ID = 'expected-client';
    process.env.JWT_SECRET = secret;
    const module = await Test.createTestingModule({
      controllers: [AuthController, IdentityController],
      providers: [
        AuthService,
        JwtService,
        UserAuthGuard,
        { provide: HttpService, useValue: { axiosRef: providerRequest } },
        { provide: UsersRepository, useValue: users },
        { provide: PendingRegistrationsRepository, useValue: registrations },
        { provide: PasswordResetRequestsRepository, useValue: resets },
        { provide: RefreshTokensRepository, useValue: tokens },
        { provide: EmailVerificationService, useValue: codes },
      ],
    }).compile();
    service = module.get(AuthService);
    jwt = module.get(JwtService);
    app = module.createNestApplication<INestApplication<Server>>({
      bodyParser: false,
      logger: false,
    });
    configureApiBoundaries(app);
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    users.findByEmail.mockResolvedValue(user);
    users.findById.mockResolvedValue(user);
    users.create.mockImplementation((value) => Promise.resolve(value));
    registrations.findByEmail.mockResolvedValue(pending);
    resets.findByEmail.mockResolvedValue(reset);
    tokens.findActiveByUserId.mockResolvedValue([]);
    codes.isCodeValid.mockReturnValue(true);
    codes.createVerificationCode.mockReturnValue({
      code: '123456',
      hash: 'verification-hash',
      salt,
      expiresAt: future,
    });
  });

  afterEach(() => jest.restoreAllMocks());

  afterAll(async () => {
    await app.close();
    if (previousAudience === undefined) delete process.env.GOOGLE_WEB_CLIENT_ID;
    else process.env.GOOGLE_WEB_CLIENT_ID = previousAudience;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  it.each([
    'login',
    'google',
    'refresh',
    'register',
    'verify-email',
    'resend-verification-code',
    'request-password-reset',
    'verify-password-reset-code',
    'reset-password',
  ])('validates /auth/%s before service calls', async (route) => {
    const response = await request(app.getHttpServer())
      .post(`/auth/${route}`)
      .send({})
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      message: 'Request validation failed.',
    });
    expect(response.body).not.toHaveProperty('error');
    expect(users.findByEmail).not.toHaveBeenCalled();
    expect(providerRequest).not.toHaveBeenCalled();
    expect(tokens.findActiveByUserId).not.toHaveBeenCalled();
  });

  it.each(['unknown account', 'wrong password'])(
    'does not distinguish login failures: %s',
    async (reason) => {
      if (reason === 'unknown account')
        users.findByEmail.mockResolvedValue(undefined);
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'wrong-password' })
        .expect(401, {
          statusCode: 401,
          code: 'AUTH_CREDENTIALS_INVALID',
          message: 'Email or password is invalid.',
        });
    },
  );

  it.each(['register', 'resend-verification-code', 'verify-email'])(
    'codes an existing account on %s',
    async (route) => {
      const body =
        route === 'register'
          ? { email, password, passwordConfirmation: password }
          : route === 'verify-email'
            ? { email, code: '123456' }
            : { email };
      await request(app.getHttpServer())
        .post(`/auth/${route}`)
        .send(body)
        .expect(409, {
          statusCode: 409,
          code: 'AUTH_EMAIL_ALREADY_EXISTS',
          message: 'User with this email already exists.',
        });
    },
  );

  it.each(['resend-verification-code', 'verify-email'])(
    'codes a missing registration on %s',
    async (route) => {
      users.findByEmail.mockResolvedValue(undefined);
      registrations.findByEmail.mockResolvedValue(undefined);
      const body =
        route === 'verify-email' ? { email, code: '123456' } : { email };
      await request(app.getHttpServer())
        .post(`/auth/${route}`)
        .send(body)
        .expect(400, {
          statusCode: 400,
          code: 'AUTH_REGISTRATION_NOT_PENDING',
          message: 'No pending registration found.',
        });
    },
  );

  it.each(['wrong', 'expired'])(
    'codes a %s email verification code',
    async (reason) => {
      users.findByEmail.mockResolvedValue(undefined);
      if (reason === 'expired')
        registrations.findByEmail.mockResolvedValue({
          ...pending,
          verificationExpiresAt: past,
        });
      else codes.isCodeValid.mockReturnValue(false);
      const response = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ email, code: '123456' })
        .expect(400);
      expect(response.body).toEqual(
        reason === 'expired'
          ? {
              statusCode: 400,
              code: 'AUTH_VERIFICATION_CODE_EXPIRED',
              message: 'Verification code has expired.',
            }
          : {
              statusCode: 400,
              code: 'AUTH_VERIFICATION_CODE_INVALID',
              message: 'Verification code is invalid.',
            },
      );
      expect(users.create).not.toHaveBeenCalled();
    },
  );

  it.each(['absent', 'wrong', 'expired'])(
    'codes a %s password reset code',
    async (reason) => {
      if (reason === 'absent') resets.findByEmail.mockResolvedValue(undefined);
      if (reason === 'expired')
        resets.findByEmail.mockResolvedValue({
          ...reset,
          verificationExpiresAt: past,
        });
      if (reason === 'wrong') codes.isCodeValid.mockReturnValue(false);
      const response = await request(app.getHttpServer())
        .post('/auth/verify-password-reset-code')
        .send({ email, code: '123456' })
        .expect(400);
      expect(response.body).toEqual(
        reason === 'expired'
          ? {
              statusCode: 400,
              code: 'AUTH_RESET_CODE_EXPIRED',
              message: 'Verification code has expired.',
            }
          : {
              statusCode: 400,
              code: 'AUTH_RESET_CODE_INVALID',
              message: 'Verification code is invalid.',
            },
      );
      expect(resets.updateResetToken).not.toHaveBeenCalled();
    },
  );

  it.each(['absent', 'incomplete', 'wrong token', 'missing user', 'expired'])(
    'codes a reset request with %s',
    async (reason) => {
      if (reason === 'absent') resets.findByEmail.mockResolvedValue(undefined);
      if (reason === 'incomplete')
        resets.findByEmail.mockResolvedValue({
          ...reset,
          resetTokenSalt: null,
        });
      if (reason === 'wrong token')
        resets.findByEmail.mockResolvedValue({
          ...reset,
          resetTokenHash: '00',
        });
      if (reason === 'missing user')
        users.findByEmail.mockResolvedValue(undefined);
      if (reason === 'expired')
        resets.findByEmail.mockResolvedValue({
          ...reset,
          resetTokenExpiresAt: past,
        });
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ email, password, passwordConfirmation: password, resetToken })
        .expect(400);
      expect(response.body).toEqual(
        reason === 'expired'
          ? {
              statusCode: 400,
              code: 'AUTH_RESET_REQUEST_EXPIRED',
              message: 'Password reset request has expired.',
            }
          : {
              statusCode: 400,
              code: 'AUTH_RESET_REQUEST_INVALID',
              message: 'Password reset request is invalid.',
            },
      );
      expect(users.updatePassword).not.toHaveBeenCalled();
    },
  );

  it.each(['no matching token', 'malformed user ID', 'missing user'])(
    'rejects refresh with %s',
    async (reason) => {
      let refreshToken = `${user.id}.secret`;
      if (reason === 'malformed user ID') refreshToken = '.secret';
      if (reason === 'missing user') {
        tokens.findActiveByUserId.mockResolvedValue([
          {
            id: 'refresh-record',
            userId: user.id,
            createdAt: past,
            expiresAt: future,
            revokedAt: null,
            tokenSalt: salt,
            tokenHash: pbkdf2Sync(
              refreshToken,
              salt,
              100_000,
              64,
              'sha512',
            ).toString('hex'),
          },
        ]);
        users.findById.mockResolvedValue(undefined);
      }
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401, {
          statusCode: 401,
          code: 'AUTH_REFRESH_REJECTED',
          message: 'Refresh token is invalid.',
        });
      expect(tokens.revoke).not.toHaveBeenCalled();
    },
  );

  it.each([
    'provider HTTP rejection',
    'wrong audience',
    'unverified email',
    'missing email',
  ])('rejects Google identity: %s', async (reason) => {
    if (reason === 'provider HTTP rejection')
      providerRequest.mockRejectedValue(new ExternalHttpError(503));
    else
      providerRequest.mockResolvedValue({
        data: {
          aud: reason === 'wrong audience' ? 'other-client' : 'expected-client',
          email: reason === 'missing email' ? undefined : email,
          email_verified: reason === 'unverified email' ? 'false' : 'true',
        },
      });
    await request(app.getHttpServer())
      .post('/auth/google')
      .send({ idToken: 'secret-google-token' })
      .expect(401, {
        statusCode: 401,
        code: 'AUTH_GOOGLE_IDENTITY_REJECTED',
        message: 'Google identity is invalid.',
      });
    expect(users.findByEmail).not.toHaveBeenCalled();
  });

  it.each([
    null,
    undefined,
    { aud: 'expected-client', email_verified: 'true', email: 42 },
  ])('safely rejects malformed Google data %#', async (data) => {
    providerRequest.mockResolvedValue({ data });
    await request(app.getHttpServer())
      .post('/auth/google')
      .send({ idToken: 'secret-google-token' })
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      });
    expect(users.findByEmail).not.toHaveBeenCalled();
  });

  it.each([[], 'malformed', 42])(
    'keeps primitive/array Google payload rejection unauthorized %#',
    async (data) => {
      providerRequest.mockResolvedValue({ data });
      await request(app.getHttpServer())
        .post('/auth/google')
        .send({ idToken: 'secret-google-token' })
        .expect(401, {
          statusCode: 401,
          code: 'AUTH_GOOGLE_IDENTITY_REJECTED',
          message: 'Google identity is invalid.',
        });
      expect(users.findByEmail).not.toHaveBeenCalled();
    },
  );

  it.each(['repository', 'SMTP', 'Google network'])(
    'hides an unexpected %s failure',
    async (source) => {
      const failure = new Error('secret-provider-credentials');
      let route = 'login';
      let body: object = { email, password };
      if (source === 'repository') users.findByEmail.mockRejectedValue(failure);
      if (source === 'SMTP') {
        route = 'request-password-reset';
        body = { email };
        codes.sendPasswordResetCode.mockRejectedValue(failure);
      }
      if (source === 'Google network') {
        route = 'google';
        body = { idToken: 'secret-token' };
        providerRequest.mockRejectedValue(failure);
      }
      await request(app.getHttpServer())
        .post(`/auth/${route}`)
        .send(body)
        .expect(500, {
          statusCode: 500,
          code: 'INTERNAL_ERROR',
          message: 'Internal server error.',
        });
    },
  );

  it('preserves password-reset success for both existing and missing accounts', async () => {
    const existing = await request(app.getHttpServer())
      .post('/auth/request-password-reset')
      .send({ email })
      .expect(201);
    users.findByEmail.mockResolvedValue(undefined);
    const missing = await request(app.getHttpServer())
      .post('/auth/request-password-reset')
      .send({ email })
      .expect(201);
    expect(existing.body).toEqual({ email, verificationExpiresAt: future });
    expect(missing.body).toEqual(existing.body);
    expect(codes.sendPasswordResetCode).toHaveBeenCalledTimes(1);
  });

  it('keeps successful login and verified identity responses unchanged', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    expect(response.body).toHaveProperty('user.id', user.id);
    expect(response.body).not.toHaveProperty('code');
    expect(response.body).not.toHaveProperty('user.passwordHash');
    const token = jwt.issueAccessToken(user).accessToken;
    await request(app.getHttpServer())
      .get(`/auth-contract-test/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, { email, id: user.id });
  });

  it.each(['missing', 'wrong scheme'])(
    'codes %s authorization',
    async (reason) => {
      const call = request(app.getHttpServer()).get(
        `/auth-contract-test/users/${user.id}`,
      );
      if (reason === 'wrong scheme') call.set('Authorization', 'Basic secret');
      await call.expect(401, {
        statusCode: 401,
        code: 'AUTH_AUTHENTICATION_REQUIRED',
        message: 'Authentication is required.',
      });
    },
  );

  it('codes absent identity in the current-user decorator', async () => {
    await request(app.getHttpServer())
      .get('/auth-contract-test/unguarded')
      .expect(401, {
        statusCode: 401,
        code: 'AUTH_AUTHENTICATION_REQUIRED',
        message: 'Authentication is required.',
      });
  });

  it('codes ownership denial without treating it as a token failure', async () => {
    const token = jwt.issueAccessToken(user).accessToken;
    await request(app.getHttpServer())
      .get('/auth-contract-test/users/another-user')
      .set('Authorization', `Bearer ${token}`)
      .expect(403, {
        statusCode: 403,
        code: 'AUTH_OWNERSHIP_DENIED',
        message: 'Authenticated user does not match route user.',
      });
  });

  it('codes an expired signed access token', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(now - 16 * 60 * 1000);
    const token = jwt.issueAccessToken(user).accessToken;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    await request(app.getHttpServer())
      .get(`/auth-contract-test/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401, {
        statusCode: 401,
        code: 'AUTH_ACCESS_TOKEN_EXPIRED',
        message: 'Access token has expired.',
      });
  });

  it.each([
    'missing segments',
    'wrong signature',
    'malformed JSON',
    'invalid fields',
  ])('codes invalid access tokens: %s', async (reason) => {
    let token = 'invalid';
    if (reason === 'wrong signature')
      token = `${jwt.issueAccessToken(user).accessToken}tampered`;
    if (reason === 'malformed JSON' || reason === 'invalid fields') {
      const header = Buffer.from(
        JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
      ).toString('base64url');
      const payload = Buffer.from(
        reason === 'malformed JSON'
          ? '{'
          : JSON.stringify({
              sub: 42,
              email,
              exp: now / 1000 + 900,
              iat: now / 1000,
            }),
      ).toString('base64url');
      const signature = createHmac('sha256', secret)
        .update(`${header}.${payload}`)
        .digest('base64url');
      token = `${header}.${payload}.${signature}`;
    }
    await request(app.getHttpServer())
      .get(`/auth-contract-test/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401, {
        statusCode: 401,
        code: 'AUTH_ACCESS_TOKEN_INVALID',
        message: 'Access token is invalid.',
      });
  });

  it('keeps a missing-refresh-token service safeguard unauthorized', async () => {
    await expect(
      service.refreshSession({ refreshToken: '' }),
    ).rejects.toMatchObject({
      response: { statusCode: 401, code: 'AUTH_REFRESH_REJECTED' },
    });
  });

  it.each([
    {
      name: 'login input',
      run: () => service.login({ email: 'invalid', password }),
      code: 'VALIDATION_FAILED',
    },
    {
      name: 'login password',
      run: () => service.login({ email, password: '' }),
      code: 'VALIDATION_FAILED',
    },
    {
      name: 'registration email',
      run: () =>
        service.register({
          email: 'invalid',
          password,
          passwordConfirmation: password,
        }),
      code: 'VALIDATION_FAILED',
    },
    {
      name: 'registration password',
      run: () =>
        service.register({
          email,
          password: 'short',
          passwordConfirmation: 'short',
        }),
      code: 'VALIDATION_FAILED',
    },
    {
      name: 'registration confirmation',
      run: () =>
        service.register({
          email,
          password,
          passwordConfirmation: 'different',
        }),
      code: 'VALIDATION_FAILED',
    },
    {
      name: 'resend email',
      run: () => service.resendVerificationCode({ email: 'invalid' }),
      code: 'VALIDATION_FAILED',
    },
    {
      name: 'password-reset email',
      run: () => service.requestPasswordReset({ email: 'invalid' }),
      code: 'VALIDATION_FAILED',
    },
    {
      name: 'email verification format',
      run: () => service.verifyEmail({ email, code: 'invalid' }),
      code: 'AUTH_VERIFICATION_CODE_INVALID',
    },
    {
      name: 'reset code format',
      run: () => service.verifyPasswordResetCode({ email, code: 'invalid' }),
      code: 'AUTH_RESET_CODE_INVALID',
    },
    {
      name: 'reset request input',
      run: () =>
        service.resetPassword({
          email: 'invalid',
          password,
          passwordConfirmation: password,
          resetToken,
        }),
      code: 'AUTH_RESET_REQUEST_INVALID',
    },
    {
      name: 'reset password length',
      run: () =>
        service.resetPassword({
          email,
          password: 'short',
          passwordConfirmation: 'short',
          resetToken,
        }),
      code: 'VALIDATION_FAILED',
    },
    {
      name: 'reset password confirmation',
      run: () =>
        service.resetPassword({
          email,
          password,
          passwordConfirmation: 'different',
          resetToken,
        }),
      code: 'VALIDATION_FAILED',
    },
    {
      name: 'Google token input',
      run: () => service.loginWithGoogle({ idToken: '' }),
      code: 'VALIDATION_FAILED',
    },
  ])(
    'codes the $name service safeguard blocked by DTO validation',
    async ({ run, code }) => {
      await expect(run()).rejects.toMatchObject({
        response: { statusCode: 400, code },
      });
    },
  );
});
