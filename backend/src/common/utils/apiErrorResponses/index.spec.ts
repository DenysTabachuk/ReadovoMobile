import { COMMON_ERRORS } from '../../errors/common-errors';
import { apiErrorResponses } from '.';

describe('apiErrorResponses', () => {
  it('groups fixed statuses, requiring details only for validation', () => {
    const definitions = [
      COMMON_ERRORS.VALIDATION_FAILED,
      COMMON_ERRORS.REQUEST_MALFORMED,
    ];
    const before = JSON.stringify(definitions);
    const responses = apiErrorResponses(definitions);
    const expectedRules: unknown = expect.arrayContaining([
      'STRING_REQUIRED',
      'VALUE_INVALID',
    ]);
    expect(responses).toHaveLength(2);
    expect(responses[0]).toMatchObject({
      status: 400,
      schema: {
        oneOf: [
          {
            required: ['statusCode', 'code', 'message', 'details'],
            properties: {
              code: { enum: ['VALIDATION_FAILED'] },
              statusCode: { enum: [400] },
              details: {
                required: ['fields'],
                properties: {
                  fields: {
                    items: {
                      properties: {
                        path: {
                          items: {
                            oneOf: [
                              { type: 'string' },
                              { type: 'integer', minimum: 0 },
                            ],
                          },
                        },
                        rule: {
                          enum: expectedRules,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            required: ['statusCode', 'code', 'message'],
            additionalProperties: false,
            properties: { code: { enum: ['REQUEST_MALFORMED'] } },
          },
          {
            properties: {
              code: { enum: ['REQUEST_REJECTED'] },
              statusCode: { enum: [400] },
            },
          },
        ],
      },
    });
    expect(JSON.stringify(definitions)).toBe(before);
  });

  it('keeps variable rejection statuses separate from fixed-status errors', () => {
    const description: unknown = expect.any(String);
    expect(apiErrorResponses([])).toEqual([
      {
        status: 'default',
        description,
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['statusCode', 'code', 'message'],
          properties: {
            statusCode: { type: 'integer', minimum: 400, maximum: 599 },
            code: { type: 'string', enum: ['REQUEST_REJECTED'] },
            message: { type: 'string', enum: ['Request rejected.'] },
          },
        },
      },
    ]);
  });
});
