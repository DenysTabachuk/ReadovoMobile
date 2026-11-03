import { type INestApplication, type Type } from '@nestjs/common';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';

/**
 * Scans explicitly selected pilot modules using the same settings for UI and export.
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
    .setTitle('Readovo HTTP API — translations pilot')
    .setDescription(
      'Partial API coverage: only translations is documented in this pilot.',
    )
    // TODO: Define API contract versioning rules and choose the version's source
    // (explicit contract version or backend release version). Keep the pilot stable.
    .setVersion('1.0.0')
    .build();
  // Read controller/DTO decorator metadata and add paths, requests and responses.
  // Return the assembled object in memory; JSON export is a separate step.
  return SwaggerModule.createDocument(app, config, {
    include: modules,
    autoTagControllers: false,
  });
}
