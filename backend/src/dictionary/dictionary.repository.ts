import { Injectable } from '@nestjs/common';

import { type DictionaryWord as DictionaryWordModel } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { type DictionaryWord, type DictionaryWordProgress } from './types';

@Injectable()
export class DictionaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(word: DictionaryWord): Promise<DictionaryWord | null> {
    const [created] = await this.prisma.dictionaryWord.createManyAndReturn({
      data: {
        context: word.context,
        correctAnswersCount: word.correctAnswersCount,
        createdAt: new Date(word.createdAt),
        id: word.id,
        normalizedWord: word.word.trim().toLowerCase(),
        progress: word.progress,
        translation: word.translation,
        userId: word.userId,
        word: word.word,
      },
      skipDuplicates: true,
    });

    return created ? this.toDictionaryWord(created) : null;
  }

  async findAll(userId: string): Promise<DictionaryWord[]> {
    const rows = await this.prisma.dictionaryWord.findMany({
      orderBy: { createdAt: 'desc' },
      where: { userId },
    });

    return rows.map((row) => this.toDictionaryWord(row));
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<DictionaryWord | undefined> {
    const row = await this.prisma.dictionaryWord.findFirst({
      where: { id, userId },
    });

    return row ? this.toDictionaryWord(row) : undefined;
  }

  async deleteById(
    id: string,
    userId: string,
  ): Promise<DictionaryWord | undefined> {
    const row = await this.prisma.dictionaryWord.findFirst({
      where: { id, userId },
    });

    if (row) {
      await this.prisma.dictionaryWord.deleteMany({ where: { id, userId } });
    }

    return row ? this.toDictionaryWord(row) : undefined;
  }

  async findReviewCandidates(
    userId: string,
    limit: number,
  ): Promise<DictionaryWord[]> {
    const rows = await this.prisma.dictionaryWord.findMany({
      orderBy: [
        { lastReviewedAt: { sort: 'asc', nulls: 'first' } },
        { createdAt: 'asc' },
      ],
      take: limit,
      where: { userId },
    });

    return rows.map((row) => this.toDictionaryWord(row));
  }

  async updateReviewResult(
    id: string,
    userId: string,
    progress: DictionaryWordProgress,
    correctAnswersCount: number,
    reviewedAt: string,
  ): Promise<DictionaryWord | undefined> {
    const updated = await this.prisma.dictionaryWord.updateMany({
      data: {
        correctAnswersCount,
        lastReviewedAt: new Date(reviewedAt),
        progress,
      },
      where: { id, userId },
    });
    const row = updated.count
      ? await this.prisma.dictionaryWord.findUnique({ where: { id } })
      : null;

    return row ? this.toDictionaryWord(row) : undefined;
  }

  async updateProgress(
    id: string,
    userId: string,
    progress: DictionaryWordProgress,
    correctAnswersCount: number,
  ): Promise<DictionaryWord | undefined> {
    const updated = await this.prisma.dictionaryWord.updateMany({
      data: { correctAnswersCount, progress },
      where: { id, userId },
    });
    const row = updated.count
      ? await this.prisma.dictionaryWord.findUnique({ where: { id } })
      : null;

    return row ? this.toDictionaryWord(row) : undefined;
  }

  private toDictionaryWord(row: DictionaryWordModel): DictionaryWord {
    return {
      context: row.context,
      correctAnswersCount: row.correctAnswersCount,
      createdAt: row.createdAt.toISOString(),
      id: row.id,
      lastReviewedAt: row.lastReviewedAt?.toISOString(),
      progress: row.progress,
      requiredCorrectAnswers: 5,
      translation: row.translation,
      userId: row.userId ?? '',
      word: row.word,
    };
  }
}
