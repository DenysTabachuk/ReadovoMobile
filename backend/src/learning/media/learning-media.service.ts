import { GetObjectCommand, NoSuchKey, S3Client } from '@aws-sdk/client-s3';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { Readable } from 'node:stream';
import { ApiException } from '../../common/errors/api-exception';
import { LEARNING_ERRORS } from '../learning-errors';
import { LEARNING_IMAGE_TYPES } from './constants';

const R2_S3_ORIGIN =
  /^https:\/\/[a-f0-9]{32}(?:\.(?:eu|us|fedramp))?\.r2\.cloudflarestorage\.com\/?$/;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const STORAGE_TIMEOUT_MS = 5000;

@Injectable()
export class LearningMediaService implements OnModuleDestroy {
  private readonly bucket = process.env.R2_BUCKET?.trim();
  private readonly allowedUsers = new Set(
    process.env.R2_MEDIA_ALLOWED_USER_IDS?.split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  );
  private readonly client: S3Client | null;

  constructor() {
    const endpoint = process.env.R2_ENDPOINT?.trim();
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
    this.client =
      this.bucket &&
      endpoint &&
      R2_S3_ORIGIN.test(endpoint) &&
      accessKeyId &&
      secretAccessKey &&
      this.allowedUsers.size
        ? new S3Client({
            endpoint,
            region: 'auto',
            forcePathStyle: true,
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;
  }

  /** Retrieves a bounded learning image from private storage for an allowed account. */
  async getImage(userId: string, key: string) {
    if (!this.client || !this.bucket)
      throw new ApiException(LEARNING_ERRORS.NOT_FOUND);
    if (!this.allowedUsers.has(userId))
      throw new ApiException(LEARNING_ERRORS.MEDIA_FORBIDDEN);

    const image = await this.client
      .send(new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
        abortSignal: AbortSignal.timeout(STORAGE_TIMEOUT_MS),
      })
      .catch((error: unknown) => {
        if (error instanceof NoSuchKey)
          throw new ApiException(LEARNING_ERRORS.NOT_FOUND);
        throw new ApiException(LEARNING_ERRORS.MEDIA_UNAVAILABLE);
      });

    const { Body: body, ContentLength: length, ContentType: type } = image;
    const expectedType = key.endsWith('.webp')
      ? LEARNING_IMAGE_TYPES.webp
      : LEARNING_IMAGE_TYPES.png;
    if (
      !body ||
      length === undefined ||
      length < 1 ||
      length > MAX_IMAGE_BYTES ||
      type !== expectedType
    ) {
      if (body instanceof Readable) body.destroy();
      throw new ApiException(LEARNING_ERRORS.MEDIA_UNAVAILABLE);
    }
    try {
      return { bytes: await body.transformToByteArray(), type: expectedType };
    } catch {
      throw new ApiException(LEARNING_ERRORS.MEDIA_UNAVAILABLE);
    }
  }

  onModuleDestroy() {
    this.client?.destroy();
  }
}
