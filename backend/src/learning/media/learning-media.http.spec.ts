import { NoSuchKey } from '@aws-sdk/client-s3';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { JwtService } from '../../auth/jwt.service';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import { configureApiBoundaries } from '../../common/configure-api-boundaries';
import { LearningMediaController } from './learning-media.controller';
import { LearningMediaService } from './learning-media.service';

const TEST_IMAGE_KEY = 'learning/topics/germany/v1.png';
const TEST_WEBP_KEY = 'learning/topics/germany/catalogue/v1.webp';
const webp = Buffer.from(
  'UklGRjYAAABXRUJQVlA4ICoAAADwAQCdASoBAAEAAUAmJaACdLoB+AAF9AAAm//MEr8g3Ov/43bjDfegAAA=',
  'base64',
);
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+WVKsAAAAASUVORK5CYII=',
  'base64',
);
const mockGetObject = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  ...jest.requireActual<typeof import('@aws-sdk/client-s3')>(
    '@aws-sdk/client-s3',
  ),
  S3Client: jest.fn(() => ({ send: mockGetObject, destroy: jest.fn() })),
}));

describe('Private learning media (HTTP)', () => {
  let app: INestApplication<Server>;
  let jwt: JwtService;

  function bearer(id: string) {
    const { accessToken } = jwt.issueAccessToken({
      id,
      email: 'reader@example.test',
      createdAt: '2026-11-18T00:00:00Z',
      balance: 0,
      lessonsCompleted: 0,
      testsCompleted: 0,
      wordsLearned: 0,
    });
    return `Bearer ${accessToken}`;
  }

  beforeEach(async () => {
    jest.replaceProperty(process, 'env', {
      ...process.env,
      R2_BUCKET: 'test-bucket',
      R2_ENDPOINT:
        'https://00000000000000000000000000000000.r2.cloudflarestorage.com',
      R2_ACCESS_KEY_ID: 'test-access-key',
      R2_SECRET_ACCESS_KEY: 'test-secret-key',
      R2_MEDIA_ALLOWED_USER_IDS: 'owner',
    });
    mockGetObject.mockReset();
    const module = await Test.createTestingModule({
      controllers: [LearningMediaController],
      providers: [LearningMediaService, JwtService, UserAuthGuard],
    }).compile();
    jwt = module.get(JwtService);
    app = module.createNestApplication<INestApplication<Server>>({
      logger: false,
      bodyParser: false,
    });
    configureApiBoundaries(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  it.each([
    { key: TEST_IMAGE_KEY, bytes: png, type: 'image/png' },
    {
      key: 'vocabulary/oktoberfest/tent/v1.png',
      bytes: png,
      type: 'image/png',
    },
    { key: TEST_WEBP_KEY, bytes: webp, type: 'image/webp' },
  ])(
    'delivers $type bytes without HTTP caching',
    async ({ key, bytes, type }) => {
      mockGetObject.mockResolvedValue({
        Body: {
          transformToByteArray: () => Promise.resolve(Uint8Array.from(bytes)),
        },
        ContentType: type,
        ContentLength: bytes.length,
      });
      const response = await request(app.getHttpServer())
        .get('/learning/media')
        .query({ key })
        .set('Authorization', bearer('owner'))
        .expect('Content-Type', type)
        .expect('Cache-Control', 'private, no-store')
        .expect(200);
      expect(response.body).toEqual(bytes);
      expect(mockGetObject).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { Bucket: 'test-bucket', Key: key },
        }),
        expect.anything(),
      );
    },
  );

  it('rejects missing authentication, an unlisted account and keys outside lesson media', async () => {
    await request(app.getHttpServer())
      .get('/learning/media')
      .query({ key: TEST_IMAGE_KEY })
      .expect(401);
    await request(app.getHttpServer())
      .get('/learning/media')
      .query({ key: TEST_IMAGE_KEY })
      .set('Authorization', bearer('another-user'))
      .expect(403);
    await request(app.getHttpServer())
      .get('/learning/media')
      .query({ key: 'learning/topics/../v1.png' })
      .set('Authorization', bearer('owner'))
      .expect(400);
    expect(mockGetObject).not.toHaveBeenCalled();
  });

  it('reports missing objects and handles storage errors without exposing secrets', async () => {
    mockGetObject
      .mockRejectedValueOnce(
        new NoSuchKey({ $metadata: {}, message: 'missing' }),
      )
      .mockRejectedValueOnce(new Error('private storage details'));
    await request(app.getHttpServer())
      .get('/learning/media')
      .query({ key: TEST_IMAGE_KEY })
      .set('Authorization', bearer('owner'))
      .expect(404);
    const unavailable = await request(app.getHttpServer())
      .get('/learning/media')
      .query({ key: TEST_IMAGE_KEY })
      .set('Authorization', bearer('owner'))
      .expect(503);
    expect(unavailable.text).not.toContain('private storage details');
  });
});
