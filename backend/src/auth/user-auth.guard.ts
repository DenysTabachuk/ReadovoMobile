import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { type Request } from 'express';

import { ApiException } from '../common/errors/api-exception';

import { AUTH_ERRORS } from './auth-errors';
import { JwtService } from './jwt.service';
import { type AuthenticatedUser } from './types';

type AuthenticatedRequest = Request & {
  authUser?: AuthenticatedUser;
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

    request.authUser = authUser;

    return true;
  }
}
