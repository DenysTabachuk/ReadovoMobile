import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { DOCUMENTED_API_MODULES } from './documented-modules';
import { createApiDocument } from './utils/createApiDocument';

// Import the actual documented modules. Preview mode skips their DI constructors
// and factories by default, so controller/service bindings do not need duplicates.
// Module imports still execute JavaScript; isolation tests guard against I/O.
@Module({
  imports: DOCUMENTED_API_MODULES,
})
class OpenApiExportModule {}

/**
 * Exports real modules' metadata in preview mode without HTTP listening or secrets.
 * Does not initialize application lifecycle hooks. Modules opted into initialization
 * during preview or with import-time side effects require review before inclusion.
 * @returns OpenAPI document; the temporary metadata-only application is closed.
 * @example
 * const document = await exportOpenApi();
 * // document.paths contains only /api/translations/word
 */
export async function exportOpenApi() {
  const app = await NestFactory.create(OpenApiExportModule, {
    logger: false,
    preview: true,
  });
  try {
    return createApiDocument(app, DOCUMENTED_API_MODULES);
  } finally {
    await app.close();
  }
}
