import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { type DictionaryWord, type DictionaryWordProgress } from './types';

type DictionaryWordRow = {
  context: string;
  correct_answers_count: number;
  created_at: Date;
  id: string;
  last_reviewed_at: Date | null;
  progress: DictionaryWordProgress;
  translation: string;
  user_id: string;
  word: string;
};

@Injectable()
export class DictionaryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createOrUpdate(word: DictionaryWord): Promise<DictionaryWord> {
    const result = await this.databaseService.query<DictionaryWordRow>(
      `
        INSERT INTO dictionary_words (
          id,
          user_id,
          word,
          normalized_word,
          translation,
          context,
          progress,
          correct_answers_count,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id, normalized_word) WHERE user_id IS NOT NULL
        DO UPDATE SET
          word = EXCLUDED.word,
          translation = EXCLUDED.translation,
          context = EXCLUDED.context
        RETURNING id, user_id, word, translation, context, progress, correct_answers_count, last_reviewed_at, created_at
      `,
      [
        word.id,
        word.userId,
        word.word,
        word.word.trim().toLowerCase(),
        word.translation,
        word.context,
        word.progress,
        word.correctAnswersCount,
        word.createdAt,
      ],
    );

    return this.toDictionaryWord(result.rows[0]);
  }

  async findAll(userId: string): Promise<DictionaryWord[]> {
    const result = await this.databaseService.query<DictionaryWordRow>(
      `
      SELECT id, user_id, word, translation, context, progress, correct_answers_count, last_reviewed_at, created_at
      FROM dictionary_words
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
      [userId],
    );

    return result.rows.map((row) => this.toDictionaryWord(row));
  }

  async findById(id: string, userId: string): Promise<DictionaryWord | undefined> {
    const result = await this.databaseService.query<DictionaryWordRow>(
      `
        SELECT id, user_id, word, translation, context, progress, correct_answers_count, last_reviewed_at, created_at
        FROM dictionary_words
        WHERE id = $1
          AND user_id = $2
      `,
      [id, userId],
    );

    const row = result.rows[0];

    return row ? this.toDictionaryWord(row) : undefined;
  }

  async findReviewCandidates(userId: string, limit: number): Promise<DictionaryWord[]> {
    const result = await this.databaseService.query<DictionaryWordRow>(
      `
        SELECT id, user_id, word, translation, context, progress, correct_answers_count, last_reviewed_at, created_at
        FROM dictionary_words
        WHERE user_id = $1
        ORDER BY last_reviewed_at ASC NULLS FIRST, created_at ASC
        LIMIT $2
      `,
      [userId, limit],
    );

    return result.rows.map((row) => this.toDictionaryWord(row));
  }

  async updateReviewResult(
    id: string,
    userId: string,
    progress: DictionaryWordProgress,
    correctAnswersCount: number,
    reviewedAt: string,
  ): Promise<DictionaryWord | undefined> {
    const result = await this.databaseService.query<DictionaryWordRow>(
      `
        UPDATE dictionary_words
        SET progress = $3,
            correct_answers_count = $4,
            last_reviewed_at = $5
        WHERE id = $1
          AND user_id = $2
        RETURNING id, user_id, word, translation, context, progress, correct_answers_count, last_reviewed_at, created_at
      `,
      [id, userId, progress, correctAnswersCount, reviewedAt],
    );

    const row = result.rows[0];

    return row ? this.toDictionaryWord(row) : undefined;
  }

  async updateProgress(
    id: string,
    userId: string,
    progress: DictionaryWordProgress,
    correctAnswersCount: number,
  ): Promise<DictionaryWord | undefined> {
    const result = await this.databaseService.query<DictionaryWordRow>(
      `
        UPDATE dictionary_words
        SET progress = $3,
            correct_answers_count = $4
        WHERE id = $1
          AND user_id = $2
        RETURNING id, user_id, word, translation, context, progress, correct_answers_count, last_reviewed_at, created_at
      `,
      [id, userId, progress, correctAnswersCount],
    );

    const row = result.rows[0];

    return row ? this.toDictionaryWord(row) : undefined;
  }

  private toDictionaryWord(row: DictionaryWordRow): DictionaryWord {
    return {
      context: row.context,
      correctAnswersCount: row.correct_answers_count,
      createdAt: row.created_at.toISOString(),
      id: row.id,
      lastReviewedAt: row.last_reviewed_at?.toISOString(),
      progress: row.progress,
      requiredCorrectAnswers: 5,
      translation: row.translation,
      userId: row.user_id,
      word: row.word,
    };
  }
}
