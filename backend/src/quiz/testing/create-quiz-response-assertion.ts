import Ajv, { type ValidateFunction } from 'ajv';
import { type Response } from 'supertest';

import { exportOpenApi } from '../../openapi/export-openapi';

/**
 * Compiles actual quiz-session response schemas, including nested public profiles.
 * @returns An assertion accepting an operation ID and an HTTP response. Unknown
 * explicit statuses or schema violations throw diagnostics; no Jest hooks or
 * application state are changed, and no external services are contacted.
 * @example
 * const assertResponse = await createQuizResponseAssertion();
 * // .expect(response => assertResponse('completeQuiz', response))
 * // A complete 201 result passes; missing profile/streak data throws.
 */
export async function createQuizResponseAssertion() {
  const document = await exportOpenApi();
  const validator = new Ajv({ strict: false, allErrors: true });
  validator.addFormat(
    'uuid',
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
  validator.addFormat('date', /^\d{4}-\d{2}-\d{2}$/);
  validator.addFormat(
    'date-time',
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  );
  validator.addSchema(document, 'quiz');
  const validators = new Map<string, ValidateFunction<unknown>>();
  for (const [path, item] of Object.entries(document.paths)) {
    if (!path.startsWith('/quiz-sessions/')) continue;
    const operation = item?.post;
    if (!operation) continue;
    const pointer = path.replaceAll('~', '~0').replaceAll('/', '~1');
    for (const status of Object.keys(operation.responses)) {
      validators.set(
        `${operation.operationId}:${status}`,
        validator.compile<unknown>({
          $ref: `quiz#/paths/${pointer}/post/responses/${status}/content/application~1json/schema`,
        }),
      );
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
