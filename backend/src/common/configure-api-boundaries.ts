import { HttpException, type INestApplication } from '@nestjs/common';
import {
  json,
  type NextFunction,
  type Request,
  type Response,
  urlencoded,
} from 'express';

import { ApiException } from './errors/api-exception';
import { ApiExceptionFilter } from './errors/api-exception.filter';
import { COMMON_ERRORS } from './errors/common-errors';
import { configureRequestValidation } from './validation/configure-request-validation';

const REQUEST_BODY_LIMIT = '2mb';

/**
 * Installs shared API error serialization, DTO validation and body-parser limits.
 * @param app - HTTP application created with bodyParser: false, before app.init().
 * @returns Nothing; registers global filters, validation and parsing middleware.
 * Call once during application setup, including in HTTP tests.
 * @example
 * const app = await NestFactory.create(AppModule, { bodyParser: false });
 * configureApiBoundaries(app);
 * // Invalid JSON now returns HTTP 400 with code REQUEST_MALFORMED.
 */
export function configureApiBoundaries(app: INestApplication): void {
  app.useGlobalFilters(new ApiExceptionFilter());
  configureRequestValidation(app);
  app.use(json({ limit: REQUEST_BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));
  app.use(
    (
      error: unknown,
      _request: Request,
      _response: Response,
      next: NextFunction,
    ) => {
      // Decode only body-parser metadata, never its message or submitted body.
      if (typeof error === 'object' && error !== null && 'type' in error) {
        if (error.type === 'entity.parse.failed') {
          next(new ApiException(COMMON_ERRORS.REQUEST_MALFORMED));
          return;
        }
        if (error.type === 'entity.too.large') {
          next(new ApiException(COMMON_ERRORS.REQUEST_TOO_LARGE));
          return;
        }
        if (
          'status' in error &&
          typeof error.status === 'number' &&
          Number.isInteger(error.status) &&
          error.status >= 400 &&
          error.status < 500
        ) {
          next(new HttpException('Request rejected.', error.status));
          return;
        }
      }
      next(error);
    },
  );
}
