import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import {
  type ArticleAdaptationsByArticleId,
  type ArticleSimplificationLevel,
  type ArticleTextTransformationType,
  type UserRecentArticle,
  type UserSavedArticle,
  type WikipediaArticle,
} from '../contracts/types';

type UserArticleRow = {
  articleId: number;
  extract: string;
  openedAt?: Date | string;
  savedAt?: Date | string;
  thumbnailUrl?: string | null;
  title: string;
  url: string;
};

@Injectable()
export class ArticleLibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async attachAvailableAdaptations<T extends WikipediaArticle>(
    articles: T[],
  ): Promise<T[]> {
    if (articles.length === 0) return articles;

    const rows = await this.prisma.articleSimplification.findMany({
      distinct: ['articleId', 'level', 'targetLength'],
      orderBy: { level: 'asc' },
      select: {
        adaptedBlocks: true,
        articleId: true,
        level: true,
        targetLength: true,
      },
      where: { articleId: { in: articles.map(({ id }) => id) } },
    });
    const adaptationsByArticleId = new Map<
      number,
      WikipediaArticle['availableAdaptations']
    >();

    for (const row of rows) {
      if (
        row.articleId === null ||
        row.adaptedBlocks === null ||
        !this.isSelectableLevel(row.level)
      ) {
        continue;
      }

      const current = adaptationsByArticleId.get(row.articleId) ?? [];
      current.push({
        level: row.level,
        transformationType: this.isTransformationType(row.targetLength)
          ? row.targetLength
          : 'adaptation',
      });
      adaptationsByArticleId.set(row.articleId, current);
    }

    return articles.map((article) => {
      const availableAdaptations = adaptationsByArticleId.get(article.id);
      return availableAdaptations?.length
        ? ({ ...article, availableAdaptations } as T)
        : article;
    });
  }

  async getSavedArticles(userId: string): Promise<UserSavedArticle[]> {
    await this.ensureUserExists(userId);
    const rows = await this.prisma.userSavedArticle.findMany({
      orderBy: { savedAt: 'desc' },
      where: { userId },
    });

    return this.attachAvailableAdaptations(
      rows.map((row) => this.mapSavedArticle(row)),
    );
  }

  async saveArticle(
    userId: string,
    article: WikipediaArticle,
  ): Promise<UserSavedArticle[]> {
    await this.ensureUserExists(userId);
    const data = {
      extract: article.extract,
      savedAt: new Date(),
      thumbnailUrl: article.thumbnailUrl ?? null,
      title: article.title,
      url: article.url,
    };

    await this.prisma.userSavedArticle.upsert({
      create: { ...data, articleId: article.id, userId },
      update: data,
      where: { userId_articleId: { articleId: article.id, userId } },
    });

    return this.getSavedArticles(userId);
  }

  async removeSavedArticle(
    userId: string,
    articleId: number,
  ): Promise<UserSavedArticle[]> {
    await this.ensureUserExists(userId);
    await this.prisma.userSavedArticle.deleteMany({
      where: { articleId, userId },
    });

    return this.getSavedArticles(userId);
  }

  async getRecentArticles(userId: string): Promise<UserRecentArticle[]> {
    await this.ensureUserExists(userId);
    const rows = await this.prisma.userRecentArticle.findMany({
      orderBy: { openedAt: 'desc' },
      take: 50,
      where: { userId },
    });

    return this.attachAvailableAdaptations(
      rows.map((row) => this.mapRecentArticle(row)),
    );
  }

  async recordRecentArticle(
    userId: string,
    article: WikipediaArticle,
  ): Promise<UserRecentArticle[]> {
    await this.ensureUserExists(userId);
    const data = {
      extract: article.extract,
      openedAt: new Date(),
      thumbnailUrl: article.thumbnailUrl ?? null,
      title: article.title,
      url: article.url,
    };

    await this.prisma.userRecentArticle.upsert({
      create: { ...data, articleId: article.id, userId },
      update: data,
      where: { userId_articleId: { articleId: article.id, userId } },
    });

    const retained = await this.prisma.userRecentArticle.findMany({
      orderBy: { openedAt: 'desc' },
      select: { articleId: true },
      take: 50,
      where: { userId },
    });
    await this.prisma.userRecentArticle.deleteMany({
      where: {
        articleId: { notIn: retained.map(({ articleId }) => articleId) },
        userId,
      },
    });

    return this.getRecentArticles(userId);
  }

  async getAvailableAdaptations(
    articleIds: number[],
    transformationType: ArticleTextTransformationType | 'all' = 'adaptation',
  ): Promise<ArticleAdaptationsByArticleId> {
    if (articleIds.length === 0) return {};

    const rows = await this.prisma.articleSimplification.findMany({
      distinct: ['articleId', 'level', 'targetLength'],
      orderBy: [{ articleId: 'asc' }, { level: 'asc' }],
      select: {
        adaptedBlocks: true,
        articleId: true,
        level: true,
        targetLength: true,
      },
      where: {
        articleId: { in: Array.from(new Set(articleIds)) },
        ...(transformationType === 'all'
          ? {}
          : { targetLength: transformationType }),
      },
    });
    const result: ArticleAdaptationsByArticleId = {};

    for (const row of rows) {
      if (
        row.articleId === null ||
        row.adaptedBlocks === null ||
        !this.isSelectableLevel(row.level) ||
        !this.isTransformationType(row.targetLength)
      ) {
        continue;
      }

      const articleId = String(row.articleId);
      result[articleId] = [
        ...(result[articleId] ?? []),
        { level: row.level, transformationType: row.targetLength },
      ];
    }

    return result;
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      select: { id: true },
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found.');
  }

  private mapSavedArticle(row: UserArticleRow): UserSavedArticle {
    return {
      extract: row.extract,
      id: row.articleId,
      savedAt: this.serializeTimestamp(row.savedAt),
      thumbnailUrl: row.thumbnailUrl ?? undefined,
      title: row.title,
      url: row.url,
    };
  }

  private mapRecentArticle(row: UserArticleRow): UserRecentArticle {
    return {
      extract: row.extract,
      id: row.articleId,
      openedAt: this.serializeTimestamp(row.openedAt),
      thumbnailUrl: row.thumbnailUrl ?? undefined,
      title: row.title,
      url: row.url,
    };
  }

  private serializeTimestamp(value: Date | string | undefined): string {
    return value instanceof Date
      ? value.toISOString()
      : (value ?? new Date().toISOString());
  }

  private isSelectableLevel(
    level: string,
  ): level is Exclude<ArticleSimplificationLevel, 'C1'> {
    return level === 'A1' || level === 'A2' || level === 'B1' || level === 'B2';
  }

  private isTransformationType(
    value: string,
  ): value is ArticleTextTransformationType {
    return value === 'adaptation' || value === 'summary';
  }
}
