import Ajv, { type ValidateFunction } from 'ajv';
import { type Response } from 'supertest';

import { exportOpenApi } from '../../openapi/export-openapi';

/**
 * Compiles response validators for documented notification operations offline.
 * @returns An assertion taking an operation ID and actual HTTP response. Missing
 * explicit statuses and schema violations throw diagnostics. No Firebase, timer,
 * Jest hook or application state is initialized by this helper.
 * @example
 * const assertResponse = await createNotificationsResponseAssertion();
 * // .expect(response => assertResponse('sendRemoteTestPush', response))
 * // A 201 delivery summary passes; omitted required counters throw.
 */
export async function createNotificationsResponseAssertion() {
  const document = await exportOpenApi();
  const validator = new Ajv({ strict: false, allErrors: true });
  validator.addSchema(document, 'notifications');
  const validators = new Map<string, ValidateFunction<unknown>>();
  for (const [path, item] of Object.entries(document.paths)) {
    if (!path.startsWith('/notifications/')) continue;
    const pointer = path.replaceAll('~', '~0').replaceAll('/', '~1');
    for (const method of ['get', 'put', 'post', 'delete'] as const) {
      const operation = item?.[method];
      if (!operation) continue;
      for (const status of Object.keys(operation.responses)) {
        validators.set(
          `${operation.operationId}:${status}`,
          validator.compile<unknown>({
            $ref: `notifications#/paths/${pointer}/${method}/responses/${status}/content/application~1json/schema`,
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
