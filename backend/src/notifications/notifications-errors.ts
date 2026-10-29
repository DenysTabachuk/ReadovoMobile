import { type ApiErrorDefinition } from '../common/errors/api-error-definition';

export const NOTIFICATIONS_ERRORS = {
  DISPATCH_CLEAR_DISABLED: {
    code: 'NOTIFICATIONS_DISPATCH_CLEAR_DISABLED',
    statusCode: 403,
    message: 'Clearing reminder dispatches is disabled in production.',
  },
  MANUAL_DISPATCH_DISABLED: {
    code: 'NOTIFICATIONS_MANUAL_DISPATCH_DISABLED',
    statusCode: 403,
    message: 'Manual reminder dispatch is disabled in production.',
  },
} as const satisfies Record<string, ApiErrorDefinition>;
