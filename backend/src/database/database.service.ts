import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';

const defaultDatabaseUrl =
  'postgres://readovo:readovo_password@localhost:5432/readovo';

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
      CREATE TABLE IF NOT EXISTS pending_user_registrations (
        id uuid PRIMARY KEY,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        password_salt text NOT NULL,
        verification_code_hash text NOT NULL,
        verification_code_salt text NOT NULL,
        verification_expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
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
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
      SELECT user_id, 'ten_tests_completed', unlocked_at
      FROM user_achievements
      WHERE achievement_id = 'ten_lessons_completed'
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    `);

    await this.query(`
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
      SELECT id, 'ten_tests_completed', now()
      FROM users
      WHERE tests_completed >= 10
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    `);

    await this.query(`
      DELETE FROM user_achievements
      WHERE achievement_id = 'ten_lessons_completed';
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS article_simplifications (
        cache_key text PRIMARY KEY,
        article_id integer,
        title text NOT NULL,
        level text NOT NULL,
        target_length text NOT NULL,
        target_percent integer,
        source_hash text,
        original_length integer NOT NULL,
        adapted_text text,
        adapted_blocks jsonb,
        questions jsonb,
        adapted_length integer NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await this.query(`
      ALTER TABLE article_simplifications
      ADD COLUMN IF NOT EXISTS article_id integer,
      ADD COLUMN IF NOT EXISTS target_percent integer,
      ADD COLUMN IF NOT EXISTS source_hash text,
      ADD COLUMN IF NOT EXISTS adapted_blocks jsonb,
      ADD COLUMN IF NOT EXISTS questions jsonb,
      ALTER COLUMN adapted_text DROP NOT NULL;
    `);

    await this.query(`
      CREATE INDEX IF NOT EXISTS article_simplifications_article_id_idx
      ON article_simplifications (article_id);
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
      ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz,
      ADD COLUMN IF NOT EXISTS correct_answers_count integer NOT NULL DEFAULT 0;
    `);

    await this.query(`
      UPDATE dictionary_words
      SET correct_answers_count = CASE
        WHEN progress = 'learned' THEN 5
        WHEN progress = 'in_progress' AND correct_answers_count = 0 THEN 1
        ELSE correct_answers_count
      END;
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
