import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import {
  ApiErrorResponses,
  type ApiErrorResponsesOptions,
} from '../common/decorators/api-error-responses.decorator';
import { AUTH_ERRORS } from './auth-errors';
import { UserAuthGuard } from './user-auth.guard';

/**
 * Protects an operation with UserAuthGuard and documents its Bearer/error contract.
 * @param options - Additional operation errors and DTO validation opt-in. Token
 * errors and shared HTTP errors are included automatically, without changing
 * the caller's options. The owning module must import AuthModule.
 * @returns A method decorator installing the real guard and Swagger metadata.
 * Pass operation errors here instead of stacking ApiErrorResponses, which can
 * overwrite Swagger responses with the same status. This does not check ownership.
 * @example
 * @ApiUserAuth({ errors: [ACHIEVEMENTS_ERRORS.USER_NOT_FOUND] })
 * // Requires a valid access token; documents token errors and the domain 404.
 */
export function ApiUserAuth(
  options: ApiErrorResponsesOptions = {},
): MethodDecorator {
  return applyDecorators(
    UseGuards(UserAuthGuard),
    ApiBearerAuth(),
    ApiErrorResponses({
      ...options,
      errors: [
        AUTH_ERRORS.AUTHENTICATION_REQUIRED,
        AUTH_ERRORS.ACCESS_TOKEN_INVALID,
        AUTH_ERRORS.ACCESS_TOKEN_EXPIRED,
        ...(options.errors ?? []),
      ],
    }),
  );
}
