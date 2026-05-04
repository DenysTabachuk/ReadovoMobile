import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';

const defaultDatabaseUrl =
  'postgres://speakly:speakly_password@localhost:5432/speakly';

@Injectable()
export class DatabaseService implements OnModuleDestroy, OnModuleInit {
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  });

  async onModuleInit(): Promise<void> {
    await this.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        password_salt text NOT NULL,
        lessons_completed integer NOT NULL DEFAULT 0,
        tests_completed integer NOT NULL DEFAULT 0,
        words_learned integer NOT NULL DEFAULT 0,
        balance integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await this.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS lessons_completed integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tests_completed integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS words_learned integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS balance integer NOT NULL DEFAULT 0;
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id text NOT NULL,
        unlocked_at timestamptz NOT NULL DEFAULT now(),
        claimed_at timestamptz,
        PRIMARY KEY (user_id, achievement_id)
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS article_simplifications (
        cache_key text PRIMARY KEY,
        title text NOT NULL,
        level text NOT NULL,
        target_length text NOT NULL,
        original_length integer NOT NULL,
        adapted_text text NOT NULL,
        adapted_length integer NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS dictionary_words (
        id uuid PRIMARY KEY,
        word text NOT NULL,
        normalized_word text NOT NULL UNIQUE,
        translation text NOT NULL,
        context text NOT NULL,
        progress text NOT NULL DEFAULT 'new',
        last_reviewed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await this.query(`
      ALTER TABLE dictionary_words
      ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz;
    `);
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
