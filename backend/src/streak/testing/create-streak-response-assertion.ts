import Ajv, { type ValidateFunction } from 'ajv';
import { type Response } from 'supertest';

import { exportOpenApi } from '../../openapi/export-openapi';

/**
 * Compiles response validators for documented streak operations, without I/O.
 * @returns An assertion accepting an operation ID and an actual HTTP response.
 * Missing explicit status schemas and invalid wire bodies throw diagnostic errors.
 * This does not install Jest hooks or change the application under test.
 * @example
 * const assertResponse = await createStreakResponseAssertion();
 * // Pass a real GET /streak/profile/me response to validate its documented body:
 * // .expect(response => assertResponse('getStreakProfile', response))
 * // A valid 200 profile passes; a profile missing serverNow throws.
 */
export async function createStreakResponseAssertion() {
  const document = await exportOpenApi();
  const validator = new Ajv({ strict: false, allErrors: true });
  validator.addFormat('date', /^\d{4}-\d{2}-\d{2}$/);
  validator.addFormat(
    'date-time',
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  );
  validator.addSchema(document, 'streak');
  const validators = new Map<string, ValidateFunction<unknown>>();
  for (const [path, item] of Object.entries(document.paths)) {
    if (!path.startsWith('/streak/')) continue;
    const pointer = path.replaceAll('~', '~0').replaceAll('/', '~1');
    for (const method of ['get', 'post'] as const) {
      const operation = item?.[method];
      if (!operation) continue;
      for (const status of Object.keys(operation.responses)) {
        validators.set(
          `${operation.operationId}:${status}`,
          validator.compile<unknown>({
            $ref: `streak#/paths/${pointer}/${method}/responses/${status}/content/application~1json/schema`,
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
