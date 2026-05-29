import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type Request } from 'express';

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
      throw new UnauthorizedException(
        'Authorization bearer token is required.',
      );
    }

    const authUser = this.jwtService.verifyAccessToken(token);

    if (request.params.userId && request.params.userId !== authUser.id) {
      throw new ForbiddenException(
        'Authenticated user does not match route user.',
      );
    }

    request.authUser = authUser;

    return true;
  }
}
