import {
  BadRequestException,
  Body,
  Controller,
  Get,
  type INestApplication,
  NotFoundException,
  Post,
  Res,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { type Response } from 'express';
import { type Server } from 'node:http';
import request from 'supertest';

import { configureApiBoundaries } from './configure-api-boundaries';
import { ApiException } from './errors/api-exception';
import { COMMON_ERRORS } from './errors/common-errors';

class ChildDto {
  @IsString()
  text!: string;
}

class RequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChildDto)
  blocks!: ChildDto[];
}

@Controller('boundary-test')
class BoundaryController {
  @Post()
  accept(@Body() body: RequestDto) {
    return body;
  }

  @Get('application')
  application() {
    throw new ApiException(COMMON_ERRORS.REQUEST_TOO_LARGE);
  }

  @Get('unclassified')
  unclassified(@Res({ passthrough: true }) response: Response) {
    response.setHeader('Retry-After', '10');
    throw new BadRequestException({
      message: 'secret-provider-payload',
      code: 'INVENTED_CODE',
      details: { password: 'secret-password' },
    });
  }

  @Get('resource')
  resource() {
    throw new NotFoundException('Missing domain resource.');
  }

  @Get('unexpected')
  unexpected() {
    throw new Error('secret-database-credentials');
  }
}

describe('API boundaries (HTTP)', () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [BoundaryController],
    }).compile();
    app = module.createNestApplication<INestApplication<Server>>({
      bodyParser: false,
      logger: false,
    });
    configureApiBoundaries(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('keeps successful responses unchanged', async () => {
    const body = { blocks: [{ text: 'hello' }] };
    await request(app.getHttpServer())
      .post('/boundary-test')
      .send(body)
      .expect(201, body);
  });

  it('returns stable nested and unknown-property rules without submitted data', async () => {
    const response = await request(app.getHttpServer())
      .post('/boundary-test')
      .send({
        blocks: [{ text: 42, 'secret-property': 'secret-value' }],
        'secret-root': true,
      })
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      message: 'Request validation failed.',
    });
    expect(response.body).toHaveProperty(
      'details.fields',
      expect.arrayContaining([
        { path: ['blocks', 0, 'text'], rule: 'STRING_REQUIRED' },
        { path: ['blocks', 0], rule: 'PROPERTY_NOT_ALLOWED' },
        { path: [], rule: 'PROPERTY_NOT_ALLOWED' },
      ]),
    );
    expect(response.body).not.toHaveProperty('error');
    expect(JSON.stringify(response.body)).not.toContain('secret-');
    expect(JSON.stringify(response.body)).not.toContain('42');
  });

  it('normalizes malformed JSON without leaking parser diagnostics', async () => {
    await request(app.getHttpServer())
      .post('/boundary-test')
      .set('Content-Type', 'application/json')
      .send('{"password":"secret-malformed"')
      .expect(400, {
        statusCode: 400,
        code: 'REQUEST_MALFORMED',
        message: 'Malformed request body.',
      });
  });

  it('uses a stable fallback rule for invalid nested values', async () => {
    const response = await request(app.getHttpServer())
      .post('/boundary-test')
      .send({ blocks: ['secret-invalid-child'] })
      .expect(400);
    expect(response.body).toHaveProperty('details.fields', [
      { path: ['blocks', 0], rule: 'VALUE_INVALID' },
    ]);
    expect(JSON.stringify(response.body)).not.toContain('secret-');
  });

  it('enforces the production body limit', async () => {
    await request(app.getHttpServer())
      .post('/boundary-test')
      .send({ blocks: [{ text: 'x'.repeat(2 * 1024 * 1024) }] })
      .expect(413, {
        statusCode: 413,
        code: 'REQUEST_TOO_LARGE',
        message: 'Request body is too large.',
      });
  });

  it('retains unsupported charset status', async () => {
    const response = await request(app.getHttpServer())
      .post('/boundary-test')
      .set('Content-Type', 'application/json; charset=unsupported')
      .send('{}')
      .expect(415);
    expect(response.body).toEqual({
      statusCode: 415,
      code: 'REQUEST_REJECTED',
      message: 'Request rejected.',
    });
  });

  it.each(['get', 'post'] as const)(
    'codes an unknown route for %s',
    async (method) => {
      await request(app.getHttpServer())[method]('/missing').expect(404, {
        statusCode: 404,
        code: 'ROUTE_NOT_FOUND',
        message: 'Route not found.',
      });
    },
  );

  it('keeps domain not-found distinct from routing failures', async () => {
    const response = await request(app.getHttpServer())
      .get('/boundary-test/resource')
      .expect(404);
    expect(response.body).toEqual({
      statusCode: 404,
      code: 'REQUEST_REJECTED',
      message: 'Request rejected.',
    });
  });

  it('keeps an unsupported method as 404', async () => {
    await request(app.getHttpServer())
      .post('/boundary-test/resource')
      .expect(404, {
        statusCode: 404,
        code: 'ROUTE_NOT_FOUND',
        message: 'Route not found.',
      });
  });

  it('preserves application codes', async () => {
    await request(app.getHttpServer())
      .get('/boundary-test/application')
      .expect(413, {
        statusCode: 413,
        code: 'REQUEST_TOO_LARGE',
        message: 'Request body is too large.',
      });
  });

  it('preserves status and existing headers without copying arbitrary exception fields', async () => {
    const response = await request(app.getHttpServer())
      .get('/boundary-test/unclassified')
      .expect(400)
      .expect('Retry-After', '10');
    expect(response.body).toEqual({
      statusCode: 400,
      code: 'REQUEST_REJECTED',
      message: 'Request rejected.',
    });
  });

  it('returns safe unexpected failures', async () => {
    await request(app.getHttpServer())
      .get('/boundary-test/unexpected')
      .expect(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      });
  });
});
