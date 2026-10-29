import { type ApiErrorDefinition } from '../common/errors/api-error-definition';

/** Auth owns these public codes, HTTP statuses and safe diagnostic messages. */
export const AUTH_ERRORS = {
  CREDENTIALS_INVALID: {
    code: 'AUTH_CREDENTIALS_INVALID',
    statusCode: 401,
    message: 'Email or password is invalid.',
  },
  EMAIL_ALREADY_EXISTS: {
    code: 'AUTH_EMAIL_ALREADY_EXISTS',
    statusCode: 409,
    message: 'User with this email already exists.',
  },
  REGISTRATION_NOT_PENDING: {
    code: 'AUTH_REGISTRATION_NOT_PENDING',
    statusCode: 400,
    message: 'No pending registration found.',
  },
  VERIFICATION_CODE_INVALID: {
    code: 'AUTH_VERIFICATION_CODE_INVALID',
    statusCode: 400,
    message: 'Verification code is invalid.',
  },
  VERIFICATION_CODE_EXPIRED: {
    code: 'AUTH_VERIFICATION_CODE_EXPIRED',
    statusCode: 400,
    message: 'Verification code has expired.',
  },
  GOOGLE_IDENTITY_REJECTED: {
    code: 'AUTH_GOOGLE_IDENTITY_REJECTED',
    statusCode: 401,
    message: 'Google identity is invalid.',
  },
  REFRESH_REJECTED: {
    code: 'AUTH_REFRESH_REJECTED',
    statusCode: 401,
    message: 'Refresh token is invalid.',
  },
  RESET_CODE_INVALID: {
    code: 'AUTH_RESET_CODE_INVALID',
    statusCode: 400,
    message: 'Verification code is invalid.',
  },
  RESET_CODE_EXPIRED: {
    code: 'AUTH_RESET_CODE_EXPIRED',
    statusCode: 400,
    message: 'Verification code has expired.',
  },
  RESET_REQUEST_INVALID: {
    code: 'AUTH_RESET_REQUEST_INVALID',
    statusCode: 400,
    message: 'Password reset request is invalid.',
  },
  RESET_REQUEST_EXPIRED: {
    code: 'AUTH_RESET_REQUEST_EXPIRED',
    statusCode: 400,
    message: 'Password reset request has expired.',
  },
  AUTHENTICATION_REQUIRED: {
    code: 'AUTH_AUTHENTICATION_REQUIRED',
    statusCode: 401,
    message: 'Authentication is required.',
  },
  ACCESS_TOKEN_INVALID: {
    code: 'AUTH_ACCESS_TOKEN_INVALID',
    statusCode: 401,
    message: 'Access token is invalid.',
  },
  ACCESS_TOKEN_EXPIRED: {
    code: 'AUTH_ACCESS_TOKEN_EXPIRED',
    statusCode: 401,
    message: 'Access token has expired.',
  },
  OWNERSHIP_DENIED: {
    code: 'AUTH_OWNERSHIP_DENIED',
    statusCode: 403,
    message: 'Authenticated user does not match route user.',
  },
} as const satisfies Record<string, ApiErrorDefinition>;
