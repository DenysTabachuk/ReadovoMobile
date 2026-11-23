import Ajv, { type ValidateFunction } from 'ajv';
import { type Response } from 'supertest';

import { exportOpenApi } from '../../openapi/export-openapi';

/**
 * Compiles article wire response schemas for the real HTTP contract suites.
 * @returns An assertion resolving the actual request method/path and explicit
 * status to a schema. Unknown routes/statuses or invalid bodies throw diagnostics.
 * External dependencies are not initialized; the caller owns all HTTP app state.
 * @example
 * const assertResponse = await createArticlesResponseAssertion();
 * // request(server).get('/articles').expect(200).expect(assertResponse);
 * // Missing required preview fields now fail with schema diagnostics.
 */
export async function createArticlesResponseAssertion() {
  const document = await exportOpenApi();
  const validator = new Ajv({ strict: false, allErrors: true });
  validator.addFormat(
    'date-time',
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  );
  validator.addFormat(
    'uuid',
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
  validator.addSchema(document, 'articles');
  const routes: {
    method: string;
    pattern: RegExp;
    responses: Map<string, ValidateFunction<unknown>>;
  }[] = [];
  // Exact paths must precede /articles/{id}, which also matches the word "random".
  const paths = Object.entries(document.paths).sort(
    ([left], [right]) =>
      Number(left.includes('{')) - Number(right.includes('{')),
  );
  for (const [path, item] of paths) {
    if (
      !path.startsWith('/articles') &&
      !path.startsWith('/api/articles/') &&
      !path.startsWith('/api/users/me/articles/')
    )
      continue;
    for (const method of ['get', 'post', 'delete'] as const) {
      const operation = item?.[method];
      if (!operation) continue;
      const pointer = path.replaceAll('~', '~0').replaceAll('/', '~1');
      const responses = new Map<string, ValidateFunction<unknown>>();
      for (const status of Object.keys(operation.responses)) {
        responses.set(
          status,
          validator.compile<unknown>({
            $ref: `articles#/paths/${pointer}/${method}/responses/${status}/content/application~1json/schema`,
          }),
        );
      }
      routes.push({
        method,
        pattern: new RegExp('^' + path.replace(/\{[^}]+\}/g, '[^/]+') + '$'),
        responses,
      });
    }
  }
  return (response: Response): void => {
    const method = response.request.method.toLowerCase();
    const path = new URL(response.request.url).pathname;
    const route = routes.find(
      (route) => route.method === method && route.pattern.test(path),
    );
    const validate = route?.responses.get(String(response.status));
    if (!validate)
      throw new Error(
        `Missing article response ${method} ${path} ${response.status}`,
      );
    const body: unknown = response.body;
    if (!validate(body))
      throw new Error(
        `HTTP body violates OpenAPI: ${JSON.stringify(validate.errors)}`,
      );
  };
}
