import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { type Request } from 'express';

import { ApiException } from '../common/errors/api-exception';

import { AUTH_ERRORS } from './auth-errors';
import { JwtService } from './jwt.service';
import { type AuthenticatedUser } from './types';

type AuthenticatedRequest = Request & {
  authUser?: AuthenticatedUser;
  params: {
    userId?: string;
  };
};

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.header('authorization') ?? '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiException(AUTH_ERRORS.AUTHENTICATION_REQUIRED);
    }

    const authUser = this.jwtService.verifyAccessToken(token);

    if (request.params.userId && request.params.userId !== authUser.id) {
      throw new ApiException(AUTH_ERRORS.OWNERSHIP_DENIED);
    }

    request.authUser = authUser;

    return true;
  }
}
