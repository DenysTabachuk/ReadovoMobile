import { type INestApplication, type Type } from '@nestjs/common';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';

/**
 * Scans explicitly selected modules using the same settings for UI and export.
 * @param app - Created Nest application; initialization and HTTP listening are unnecessary.
 * @param modules - Modules whose real controller metadata belongs in the contract.
 * @returns A plain JavaScript object described by the OpenAPIObject TypeScript
 * interface: info contains API metadata, paths describes endpoints, and components
 * contains reusable schemas. This is not a JSON string or a file. It contains no
 * environment-specific URLs or timestamps and does not execute endpoint handlers.
 * @example
 * createApiDocument(app, [TranslationsModule]);
 * // => document with POST /api/translations/word and no unrelated routes
 */
export function createApiDocument(
  app: INestApplication,
  modules: Type[],
): OpenAPIObject {
  // Build only the document's general metadata: title, description and version.
  const config = new DocumentBuilder()
    .setTitle('Readovo HTTP API')
    .setDescription(
      'Partial API coverage: translations, achievements, mascot, streak and quiz sessions. Other modules are not yet documented.',
    )
    // TODO: Define API contract versioning rules and choose the version's source
    // (explicit contract version or backend release version). Keep the pilot stable.
    .setVersion('1.0.0')
    // Register the scheme without applying it globally: public routes stay public.
    .addBearerAuth()
    .build();
  // Read controller/DTO decorator metadata and add paths, requests and responses.
  // Return the assembled object in memory; JSON export is a separate step.
  return SwaggerModule.createDocument(app, config, {
    include: modules,
    autoTagControllers: false,
  });
}
