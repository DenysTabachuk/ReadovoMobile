import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { ApiException } from '../common/errors/api-exception';

import { AUTH_ERRORS } from './auth-errors';
import { type AuthenticatedUser } from './types';

type AuthenticatedRequest = {
  authUser?: AuthenticatedUser;
};

/** Reads the identity verified by UserAuthGuard; never accepts client input. */
export const CurrentUser = createParamDecorator(
  // `_data` receives an optional decorator argument (e.g. @CurrentUser('id')).
  // This implementation ignores it and always returns the entire authenticated user.
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const { authUser } = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    if (!authUser) {
      throw new ApiException(AUTH_ERRORS.AUTHENTICATION_REQUIRED);
    }
    return authUser;
  },
);
