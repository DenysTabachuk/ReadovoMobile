import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SwaggerModule } from '@nestjs/swagger';
import { type Server } from 'node:http';
import request from 'supertest';

import { configureApiBoundaries } from '../common/configure-api-boundaries';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DOCUMENTED_API_MODULES } from './documented-modules';
import { exportOpenApi } from './export-openapi';
import { createApiDocument } from './utils/createApiDocument';

describe('Documented Swagger UI (HTTP)', () => {
  it('serves local UI assets and the same document as offline export', async () => {
    const module = await Test.createTestingModule({
      imports: [PrismaModule, ...DOCUMENTED_API_MODULES],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      // This test serves documentation only; do not initialize Firebase or jobs.
      .overrideProvider(NotificationsService)
      .useValue({})
      .compile();
    const app = module.createNestApplication<INestApplication<Server>>({
      bodyParser: false,
    });
    try {
      configureApiBoundaries(app);
      SwaggerModule.setup(
        'api/docs',
        app,
        createApiDocument(app, DOCUMENTED_API_MODULES),
      );
      await app.init();
      await request(app.getHttpServer())
        .get('/api/docs/')
        .expect(200)
        .expect(/Swagger UI/);
      await request(app.getHttpServer())
        .get('/api/docs/swagger-ui-bundle.js')
        .expect(200)
        .expect('Content-Type', /javascript/);
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);
      expect(response.body).toEqual(await exportOpenApi());
    } finally {
      await app.close();
    }
  });
});
