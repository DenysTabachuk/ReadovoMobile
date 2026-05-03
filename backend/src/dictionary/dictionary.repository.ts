import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { type DictionaryWord, type DictionaryWordProgress } from './types';

type DictionaryWordRow = {
  context: string;
  created_at: Date;
  id: string;
  progress: DictionaryWordProgress;
  translation: string;
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
          word,
          normalized_word,
          translation,
          context,
          progress,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (normalized_word)
        DO UPDATE SET
          word = EXCLUDED.word,
          translation = EXCLUDED.translation,
          context = EXCLUDED.context
        RETURNING id, word, translation, context, progress, created_at
      `,
      [
        word.id,
        word.word,
        word.word.trim().toLowerCase(),
        word.translation,
        word.context,
        word.progress,
        word.createdAt,
      ],
    );

    return this.toDictionaryWord(result.rows[0]);
  }

  async findAll(): Promise<DictionaryWord[]> {
    const result = await this.databaseService.query<DictionaryWordRow>(`
      SELECT id, word, translation, context, progress, created_at
      FROM dictionary_words
      ORDER BY created_at DESC
    `);

    return result.rows.map((row) => this.toDictionaryWord(row));
  }

  private toDictionaryWord(row: DictionaryWordRow): DictionaryWord {
    return {
      context: row.context,
      createdAt: row.created_at.toISOString(),
      id: row.id,
      progress: row.progress,
      translation: row.translation,
      word: row.word,
    };
  }
}
