import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

import { ApiException } from '../common/errors/api-exception';

import { AUTH_ERRORS } from './auth-errors';
import { type AuthUser, type AuthenticatedUser } from './types';

const accessTokenTtlSeconds = 60 * 15;

type JwtHeader = {
  alg: 'HS256';
  typ: 'JWT';
};

type JwtPayload = {
  email: string;
  exp: number;
  iat: number;
  sub: string;
};

@Injectable()
export class JwtService {
  private readonly secret =
    process.env.JWT_SECRET ?? 'readovo-development-jwt-secret-change-me';

  issueAccessToken(user: AuthUser): {
    accessToken: string;
    accessTokenExpiresAt: string;
  } {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + accessTokenTtlSeconds;
    const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
    const payload: JwtPayload = {
      email: user.email,
      exp: expiresAt,
      iat: issuedAt,
      sub: user.id,
    };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`);

    return {
      accessToken: `${encodedHeader}.${encodedPayload}.${signature}`,
      accessTokenExpiresAt: new Date(expiresAt * 1000).toISOString(),
    };
  }

  verifyAccessToken(token: string): AuthenticatedUser {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new ApiException(AUTH_ERRORS.ACCESS_TOKEN_INVALID);
    }

    const expectedSignature = this.sign(`${encodedHeader}.${encodedPayload}`);

    if (!this.isEqual(signature, expectedSignature)) {
      throw new ApiException(AUTH_ERRORS.ACCESS_TOKEN_INVALID);
    }

    const payload = this.parsePayload(encodedPayload);

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new ApiException(AUTH_ERRORS.ACCESS_TOKEN_EXPIRED);
    }

    return {
      email: payload.email,
      id: payload.sub,
    };
  }

  private parsePayload(encodedPayload: string): JwtPayload {
    try {
      // JSON can contain any value. Check the required claims before using them.
      const payload: unknown = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      );

      if (
        typeof payload !== 'object' ||
        payload === null ||
        !('sub' in payload) ||
        typeof payload.sub !== 'string' ||
        !('email' in payload) ||
        typeof payload.email !== 'string' ||
        !('exp' in payload) ||
        typeof payload.exp !== 'number' ||
        !('iat' in payload) ||
        typeof payload.iat !== 'number'
      ) {
        throw new Error('Invalid payload');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        exp: payload.exp,
        iat: payload.iat,
      };
    } catch {
      throw new ApiException(AUTH_ERRORS.ACCESS_TOKEN_INVALID);
    }
  }

  private sign(value: string): string {
    return createHmac('sha256', this.secret).update(value).digest('base64url');
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value).toString('base64url');
  }

  private isEqual(value: string, expectedValue: string): boolean {
    const valueBuffer = Buffer.from(value);
    const expectedValueBuffer = Buffer.from(expectedValue);

    return (
      valueBuffer.length === expectedValueBuffer.length &&
      timingSafeEqual(valueBuffer, expectedValueBuffer)
    );
  }
}
