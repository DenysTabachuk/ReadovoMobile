import Ajv, { type ValidateFunction } from 'ajv';
import { type Response } from 'supertest';

import { exportOpenApi } from '../../openapi/export-openapi';

/**
 * Compiles documented dictionary response schemas without credentials or external I/O.
 * @returns An assertion for an operation ID and actual HTTP response. Missing
 * explicit statuses or invalid bodies throw diagnostics. No Jest hooks or app
 * state are changed; generated TypeScript is not used as runtime validation.
 * @example
 * const assertResponse = await createDictionaryResponseAssertion();
 * // .expect(response => assertResponse('createDictionaryWord', response))
 * // A complete 201 word passes; missing required fields throw.
 */
export async function createDictionaryResponseAssertion() {
  const document = await exportOpenApi();
  const validator = new Ajv({ strict: false, allErrors: true });
  validator.addFormat(
    'date-time',
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  );
  validator.addFormat('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  validator.addFormat(
    'uuid',
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
  validator.addSchema(document, 'dictionary');
  const validators = new Map<string, ValidateFunction<unknown>>();
  for (const [path, item] of Object.entries(document.paths)) {
    if (!path.startsWith('/api/dictionary/')) continue;
    for (const method of ['get', 'post', 'patch', 'delete'] as const) {
      const operation = item?.[method];
      if (!operation) continue;
      const pointer = path.replaceAll('~', '~0').replaceAll('/', '~1');
      for (const status of Object.keys(operation.responses)) {
        validators.set(
          `${operation.operationId}:${status}`,
          validator.compile<unknown>({
            $ref: `dictionary#/paths/${pointer}/${method}/responses/${status}/content/application~1json/schema`,
          }),
        );
      }
    }
  }
  return (operationId: string, response: Response): void => {
    const validate = validators.get(`${operationId}:${response.status}`);
    if (!validate)
      throw new Error(`Missing ${operationId} response ${response.status}`);
    const body: unknown = response.body;
    if (!validate(body))
      throw new Error(
        `HTTP body violates OpenAPI: ${JSON.stringify(validate.errors)}`,
      );
  };
}
