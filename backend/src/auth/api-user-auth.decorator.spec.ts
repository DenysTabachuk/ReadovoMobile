import { Controller, Get, type INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  ApiOkResponse,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { Test } from '@nestjs/testing';

import { type ApiErrorDefinition } from '../common/errors/api-error-definition';
import { ApiUserAuth } from './api-user-auth.decorator';
import { JwtService } from './jwt.service';

const OPERATION_REJECTED = {
  code: 'TEST_OPERATION_REJECTED',
  statusCode: 401,
  message: 'Operation rejected.',
} as const satisfies ApiErrorDefinition;

const operationOptions = {
  validation: true,
  errors: [OPERATION_REJECTED],
};

@Controller('auth-docs')
class AuthDocumentationController {
  @Get('default')
  @ApiOkResponse({ description: 'Successful operation.' })
  @ApiUserAuth()
  defaultErrors() {
    return undefined;
  }

  @Get('operation')
  @ApiOkResponse({ description: 'Successful operation.' })
  @ApiUserAuth(operationOptions)
  operationErrors() {
    return undefined;
  }
}

describe('ApiUserAuth documentation', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthDocumentationController],
      providers: [JwtService],
    }).compile();
    app = module.createNestApplication();
    document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
  });

  afterAll(async () => app.close());

  it('adds Bearer security and token errors without claiming DTO validation by default', () => {
    const operation = document.paths['/auth-docs/default']?.get;
    expect(operation?.security).toEqual([{ bearer: [] }]);
    expect(Object.keys(operation?.responses ?? {})).toEqual([
      '200',
      '400',
      '401',
      '413',
      '500',
      'default',
    ]);
    expect(operation?.responses['401']).toMatchObject({
      content: {
        'application/json': {
          schema: {
            oneOf: [
              {
                properties: {
                  code: { enum: ['AUTH_AUTHENTICATION_REQUIRED'] },
                },
              },
              { properties: { code: { enum: ['AUTH_ACCESS_TOKEN_INVALID'] } } },
              { properties: { code: { enum: ['AUTH_ACCESS_TOKEN_EXPIRED'] } } },
              { properties: { code: { enum: ['REQUEST_REJECTED'] } } },
            ],
          },
        },
      },
    });
    expect(JSON.stringify(operation)).not.toContain('VALIDATION_FAILED');
  });

  it('preserves operation errors sharing HTTP 401 and validation opt-in without mutating options', () => {
    const responses = document.paths['/auth-docs/operation']?.get?.responses;
    expect(responses?.['401']).toMatchObject({
      content: {
        'application/json': {
          schema: {
            oneOf: [
              {
                properties: {
                  code: { enum: ['AUTH_AUTHENTICATION_REQUIRED'] },
                },
              },
              { properties: { code: { enum: ['AUTH_ACCESS_TOKEN_INVALID'] } } },
              { properties: { code: { enum: ['AUTH_ACCESS_TOKEN_EXPIRED'] } } },
              { properties: { code: { enum: ['TEST_OPERATION_REJECTED'] } } },
              { properties: { code: { enum: ['REQUEST_REJECTED'] } } },
            ],
          },
        },
      },
    });
    expect(JSON.stringify(responses?.['400'])).toContain('VALIDATION_FAILED');
    expect(operationOptions).toEqual({
      validation: true,
      errors: [
        {
          code: 'TEST_OPERATION_REJECTED',
          statusCode: 401,
          message: 'Operation rejected.',
        },
      ],
    });
  });
});
