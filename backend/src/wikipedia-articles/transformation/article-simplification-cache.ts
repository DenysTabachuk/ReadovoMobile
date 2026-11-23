import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { toPrismaJson } from '../../common/database/prisma-json';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticleContentProcessor } from './article-content.processor';
import {
  type ArticleBlock,
  type ArticleSimplificationLevel,
  type ArticleTextTransformationType,
  type SimplifiedArticleCacheRow,
  type SimplifyArticleResponse,
} from '../contracts/types';

@Injectable()
export class ArticleSimplificationCache {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentProcessor: ArticleContentProcessor,
  ) {}

  createKey(params: {
    articleId?: number;
    level: ArticleSimplificationLevel;
    sourceHash: string;
    transformationType: ArticleTextTransformationType;
    title: string;
  }): string {
    const namespace =
      params.transformationType === 'adaptation'
        ? 'adaptation-v2'
        : 'summary-v6';
    const digest = createHash('sha256')
      .update(
        `${namespace}::${params.articleId ?? 'no-id'}::${params.title}::${params.level}::${params.sourceHash}`,
      )
      .digest('hex');

    return `${params.level}::${namespace}::${digest}`;
  }

  createSourceHash(params: {
    sourceBlocks?: ArticleBlock[];
    text: string;
    title: string;
  }): string {
    return createHash('sha256')
      .update(
        `${params.title}::${params.text}::${params.sourceBlocks ? JSON.stringify(params.sourceBlocks) : ''}`,
      )
      .digest('hex');
  }

  async get(cacheKey: string): Promise<SimplifyArticleResponse | null> {
    const cached = await this.prisma.articleSimplification.findUnique({
      where: { cacheKey },
    });
    if (!cached) return null;

    const row: SimplifiedArticleCacheRow = {
      adapted_blocks: cached.adaptedBlocks as
        SimplifiedArticleCacheRow['adapted_blocks'] | undefined,
      adapted_length: cached.adaptedLength,
      adapted_text: cached.adaptedText ?? undefined,
      article_id: cached.articleId ?? undefined,
      level: cached.level,
      original_length: cached.originalLength,
      questions: cached.questions as
        SimplifiedArticleCacheRow['questions'] | undefined,
      source_hash: cached.sourceHash ?? undefined,
      target_length: cached.targetLength,
      title: cached.title,
    };
    const adaptedBlocks = this.normalizeBlocks(row);
    if (adaptedBlocks.length === 0) return null;

    return {
      adaptedBlocks,
      adaptedLength: row.adapted_length,
      level: row.level as ArticleSimplificationLevel,
      originalLength: row.original_length,
      questions: Array.isArray(row.questions) ? row.questions : undefined,
      transformationType: this.isTransformationType(row.target_length)
        ? row.target_length
        : 'summary',
      title: row.title,
    };
  }

  async store(params: {
    articleId?: number;
    cacheKey: string;
    response: SimplifyArticleResponse;
    sourceHash: string;
  }): Promise<void> {
    const data = {
      adaptedBlocks: toPrismaJson(params.response.adaptedBlocks),
      adaptedLength: params.response.adaptedLength,
      adaptedText: this.contentProcessor.extractPlainTextFromArticleBlocks(
        params.response.adaptedBlocks,
      ),
      articleId: params.articleId,
      level: params.response.level,
      originalLength: params.response.originalLength,
      questions: params.response.questions
        ? toPrismaJson(params.response.questions)
        : Prisma.DbNull,
      sourceHash: params.sourceHash,
      targetLength: params.response.transformationType,
      targetPercent: null,
      title: params.response.title,
    };

    await this.prisma.articleSimplification.upsert({
      create: { ...data, cacheKey: params.cacheKey },
      update: data,
      where: { cacheKey: params.cacheKey },
    });
  }

  private normalizeBlocks(row: SimplifiedArticleCacheRow): ArticleBlock[] {
    if (Array.isArray(row.adapted_blocks)) return row.adapted_blocks;
    if (!row.adapted_text?.trim()) return [];

    return [
      {
        children: [{ text: row.adapted_text.trim(), type: 'text' }],
        type: 'paragraph',
      },
    ];
  }

  private isTransformationType(
    value: string,
  ): value is ArticleTextTransformationType {
    return value === 'adaptation' || value === 'summary';
  }
}
