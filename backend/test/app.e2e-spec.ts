import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureRequestValidation } from './../src/common/validation/configure-request-validation';
import { DictionaryEmbeddingService } from './../src/dictionary/dictionary-embedding.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DictionaryEmbeddingService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    configureRequestValidation(app);
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('rejects invalid and unknown request properties globally', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/translations/word')
      .send({ unexpected: true, word: 42 })
      .expect(400);

    expect(response.body).toMatchObject({
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('validates auth DTOs before calling the service', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'not-an-email',
        password: 'short',
        passwordConfirmation: 'different',
      })
      .expect(400);
  });

  it('rejects unsupported article query parameters before external calls', async () => {
    await request(app.getHttpServer())
      .get('/articles/1?languageCode=uk')
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
