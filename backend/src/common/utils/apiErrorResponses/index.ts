import { type ApiResponseOptions, type SchemaObject } from '@nestjs/swagger';

import { type ApiErrorDefinition } from '../../errors/api-error-definition';
import { COMMON_ERRORS } from '../../errors/common-errors';
import { VALIDATION_RULE_CODES } from '../../validation/create-validation-exception';

const validationDetails: SchemaObject = {
  type: 'object',
  required: ['fields'],
  additionalProperties: false,
  properties: {
    fields: {
      type: 'array',
      items: {
        type: 'object',
        required: ['path', 'rule'],
        additionalProperties: false,
        properties: {
          path: {
            type: 'array',
            items: {
              oneOf: [{ type: 'string' }, { type: 'integer', minimum: 0 }],
            },
          },
          rule: { type: 'string', enum: VALIDATION_RULE_CODES },
        },
      },
    },
  },
};

const rejectionSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['statusCode', 'code', 'message'],
  properties: {
    statusCode: { type: 'integer', minimum: 400, maximum: 599 },
    code: { type: 'string', enum: [COMMON_ERRORS.REQUEST_REJECTED.code] },
    message: { type: 'string', enum: [COMMON_ERRORS.REQUEST_REJECTED.message] },
  },
};

/**
 * Builds OpenAPI error responses from the owning modules' existing definitions.
 * @param definitions - Fixed-status errors reachable at this HTTP boundary.
 * @returns Status-grouped schemas and the shared variable-status rejection fallback.
 * Validation details are required only for VALIDATION_FAILED. Input is not mutated.
 * @example
 * apiErrorResponses([COMMON_ERRORS.INTERNAL_ERROR]);
 * // => responses for 500 (INTERNAL_ERROR) and default (REQUEST_REJECTED)
 */
export function apiErrorResponses(
  definitions: readonly ApiErrorDefinition[],
): ApiResponseOptions[] {
  const grouped = new Map<number, SchemaObject[]>();
  for (const definition of definitions) {
    const schema: SchemaObject = {
      type: 'object',
      additionalProperties: false,
      required: ['statusCode', 'code', 'message'],
      properties: {
        statusCode: { type: 'integer', enum: [definition.statusCode] },
        code: { type: 'string', enum: [definition.code] },
        message: { type: 'string', enum: [definition.message] },
      },
    };
    if (definition.code === COMMON_ERRORS.VALIDATION_FAILED.code) {
      schema.required?.push('details');
      schema.properties = { ...schema.properties, details: validationDetails };
    }
    const schemas = grouped.get(definition.statusCode) ?? [];
    schemas.push(schema);
    grouped.set(definition.statusCode, schemas);
  }
  const responses: ApiResponseOptions[] = Array.from(
    grouped,
    ([status, schemas]) => ({
      status,
      description:
        'Application-owned error. statusCode equals the HTTP status.',
      // OpenAPI's default does not apply when a status has an explicit response.
      // The shared rejection fallback can also retain one of those known statuses.
      schema: {
        oneOf: [
          ...schemas,
          {
            ...rejectionSchema,
            properties: {
              ...rejectionSchema.properties,
              statusCode: { type: 'integer', enum: [status] },
            },
          },
        ],
      },
    }),
  );
  responses.push({
    status: 'default',
    description:
      'Other rejected requests retain their HTTP error status. Infrastructure errors may have a different body.',
    schema: rejectionSchema,
  });
  return responses;
}
