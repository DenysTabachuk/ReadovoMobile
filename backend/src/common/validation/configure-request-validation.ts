import { type INestApplication, ValidationPipe } from '@nestjs/common';

import { createValidationException } from './create-validation-exception';

export function configureRequestValidation(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: createValidationException,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      whitelist: true,
    }),
  );
}
