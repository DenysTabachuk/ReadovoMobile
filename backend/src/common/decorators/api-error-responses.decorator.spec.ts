import { Controller, Get, type INestApplication, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { Test } from '@nestjs/testing';

import { type ApiErrorDefinition } from '../errors/api-error-definition';
import { ApiErrorResponses } from './api-error-responses.decorator';

const PROVIDER_UNAVAILABLE = {
  code: 'TEST_PROVIDER_UNAVAILABLE',
  statusCode: 502,
  message: 'Provider unavailable.',
} as const satisfies ApiErrorDefinition;

@Controller('error-docs')
class ErrorDocumentationController {
  @Get('default')
  @ApiOkResponse({ description: 'Successful operation.' })
  @ApiErrorResponses()
  defaultErrors() {
    return undefined;
  }

  @Post('validated')
  @ApiCreatedResponse({ description: 'Successful validated operation.' })
  @ApiErrorResponses({ validation: true, errors: [PROVIDER_UNAVAILABLE] })
  validatedErrors() {
    return undefined;
  }
}

describe('ApiErrorResponses documentation', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ErrorDocumentationController],
    }).compile();
    // Scan metadata only; no HTTP server or endpoint handler is started.
    app = module.createNestApplication();
    document = SwaggerModule.createDocument(app, new DocumentBuilder().build());
  });

  afterAll(async () => {
    await app.close();
  });

  it('adds shared errors without claiming DTO validation or provider errors by default', () => {
    const responses = document.paths['/error-docs/default']?.get?.responses;
    expect(Object.keys(responses ?? {})).toEqual([
      '200',
      '400',
      '413',
      '500',
      'default',
    ]);
    expect(responses).toMatchObject({
      '400': {
        content: {
          'application/json': {
            schema: {
              oneOf: [
                {
                  properties: {
                    code: { enum: ['REQUEST_MALFORMED'] },
                    statusCode: { enum: [400] },
                  },
                },
                {
                  properties: {
                    code: { enum: ['REQUEST_REJECTED'] },
                    statusCode: { enum: [400] },
                  },
                },
              ],
            },
          },
        },
      },
      '413': {
        content: {
          'application/json': {
            schema: {
              oneOf: [
                {
                  properties: {
                    code: { enum: ['REQUEST_TOO_LARGE'] },
                    statusCode: { enum: [413] },
                  },
                },
                {
                  properties: {
                    code: { enum: ['REQUEST_REJECTED'] },
                    statusCode: { enum: [413] },
                  },
                },
              ],
            },
          },
        },
      },
      '500': {
        content: {
          'application/json': {
            schema: {
              oneOf: [
                {
                  properties: {
                    code: { enum: ['INTERNAL_ERROR'] },
                    statusCode: { enum: [500] },
                  },
                },
                {
                  properties: {
                    code: { enum: ['REQUEST_REJECTED'] },
                    statusCode: { enum: [500] },
                  },
                },
              ],
            },
          },
        },
      },
      default: {
        content: {
          'application/json': {
            schema: {
              properties: {
                code: { enum: ['REQUEST_REJECTED'] },
                statusCode: { minimum: 400, maximum: 599 },
              },
            },
          },
        },
      },
    });
    expect(JSON.stringify(responses)).not.toContain('VALIDATION_FAILED');
    expect(JSON.stringify(responses)).not.toContain(
      'TEST_PROVIDER_UNAVAILABLE',
    );
  });

  it('adds validation details only on opt-in and preserves explicitly declared operation errors', () => {
    const responses = document.paths['/error-docs/validated']?.post?.responses;
    expect(responses).toMatchObject({
      '400': {
        content: {
          'application/json': {
            schema: {
              oneOf: [
                {
                  required: ['statusCode', 'code', 'message', 'details'],
                  properties: {
                    code: { enum: ['VALIDATION_FAILED'] },
                    details: { required: ['fields'] },
                  },
                },
                { properties: { code: { enum: ['REQUEST_MALFORMED'] } } },
                { properties: { code: { enum: ['REQUEST_REJECTED'] } } },
              ],
            },
          },
        },
      },
      '502': {
        content: {
          'application/json': {
            schema: {
              oneOf: [
                {
                  properties: {
                    code: { enum: ['TEST_PROVIDER_UNAVAILABLE'] },
                    statusCode: { enum: [502] },
                    message: { enum: ['Provider unavailable.'] },
                  },
                },
                {
                  properties: {
                    code: { enum: ['REQUEST_REJECTED'] },
                    statusCode: { enum: [502] },
                  },
                },
              ],
            },
          },
        },
      },
    });
  });
});
