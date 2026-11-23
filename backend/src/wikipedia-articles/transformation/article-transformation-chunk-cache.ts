import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { z } from 'zod';

import { toPrismaJson } from '../../common/database/prisma-json';
import { PrismaService } from '../../prisma/prisma.service';
import {
  type ArticleBlock,
  type ArticleSimplificationLevel,
  type ArticleTextTransformationType,
} from '../contracts/types';

const CACHE_NAMESPACE = 'article-transformation-chunk-v1';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1_000;

const InlineNodeSchema = z
  .object({
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    text: z.string(),
    type: z.enum(['text', 'word']),
  })
  .strict();

const CachedArticleBlockSchema = z.union([
  z
    .object({
      level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      text: z.string(),
      type: z.literal('heading'),
    })
    .strict(),
  z
    .object({
      children: z.array(InlineNodeSchema),
      type: z.literal('paragraph'),
    })
    .strict(),
  z
    .object({
      items: z.array(z.array(InlineNodeSchema)),
      ordered: z.boolean(),
      type: z.literal('list'),
    })
    .strict(),
  z
    .object({
      rows: z.array(
        z.array(
          z
            .object({
              header: z.boolean().optional(),
              text: z.string(),
            })
            .strict(),
        ),
      ),
      type: z.literal('table'),
    })
    .strict(),
  z
    .object({
      alt: z.string().optional(),
      caption: z.string().optional(),
      src: z.string(),
      type: z.literal('image'),
    })
    .strict(),
]);

const CachedArticleBlocksSchema = z.array(CachedArticleBlockSchema).min(1);

@Injectable()
export class ArticleTransformationChunkCache {
  private readonly logger = new Logger(ArticleTransformationChunkCache.name);

  constructor(private readonly prisma: PrismaService) {}

  createKey(params: {
    chunkIndex: number;
    chunkTotal: number;
    level: ArticleSimplificationLevel;
    source: string;
    sourceWordCount: number;
    title: string;
    transformationType: ArticleTextTransformationType;
  }): string {
    const digest = createHash('sha256')
      .update(JSON.stringify({ namespace: CACHE_NAMESPACE, ...params }))
      .digest('hex');

    return `${CACHE_NAMESPACE}::${digest}`;
  }

  async get(cacheKey: string): Promise<ArticleBlock[] | null> {
    const cached = await this.prisma.articleTransformationChunk.findUnique({
      select: { adaptedBlocks: true, expiresAt: true },
      where: { cacheKey },
    });
    if (!cached) return null;

    if (cached.expiresAt.getTime() <= Date.now()) {
      await this.deleteExpired(cacheKey);
      return null;
    }

    const result = CachedArticleBlocksSchema.safeParse(cached.adaptedBlocks);
    if (result.success) return result.data as ArticleBlock[];

    this.logger.warn(
      `Ignoring invalid transformation chunk cache entry: key=${cacheKey}`,
    );
    await this.deleteExpired(cacheKey);
    return null;
  }

  async store(params: {
    adaptedBlocks: ArticleBlock[];
    cacheKey: string;
  }): Promise<void> {
    const adaptedBlocks = CachedArticleBlocksSchema.parse(params.adaptedBlocks);
    const data = {
      adaptedBlocks: toPrismaJson(adaptedBlocks),
      expiresAt: new Date(Date.now() + CACHE_TTL_MS),
    };

    await this.prisma.articleTransformationChunk.upsert({
      create: { ...data, cacheKey: params.cacheKey },
      update: data,
      where: { cacheKey: params.cacheKey },
    });
  }

  private async deleteExpired(cacheKey: string): Promise<void> {
    try {
      await this.prisma.articleTransformationChunk.delete({
        where: { cacheKey },
      });
    } catch (error) {
      if (!this.isRecordNotFoundError(error)) throw error;
    }
  }

  private isRecordNotFoundError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    );
  }
}
