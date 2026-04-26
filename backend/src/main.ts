import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

const bootstrapLogger = new Logger('Bootstrap');
loadBackendEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const port = process.env.PORT ?? 3000;

  bootstrapLogger.log(
    `Starting backend on port ${port}. GROQ_API_KEY configured=${Boolean(process.env.GROQ_API_KEY)}`,
  );

  await app.listen(port, '0.0.0.0');
}
void bootstrap();

function loadBackendEnv(): void {
  const envPaths = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'backend/.env'),
    join(__dirname, '..', '.env'),
  ];

  const envPath = envPaths.find((currentPath) => existsSync(currentPath));

  if (envPath) {
    loadEnv({ path: envPath });
    bootstrapLogger.log(`Loaded environment variables from ${envPath}`);
    return;
  }

  bootstrapLogger.warn('No .env file was found for backend startup.');
}
