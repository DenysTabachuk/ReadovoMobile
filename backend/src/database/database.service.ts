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
      CREATE TABLE IF NOT EXISTS password_reset_requests (
        id uuid PRIMARY KEY,
        email text NOT NULL UNIQUE,
        verification_code_hash text NOT NULL,
        verification_code_salt text NOT NULL,
        verification_expires_at timestamptz NOT NULL,
        reset_token_hash text,
        reset_token_salt text,
        reset_token_expires_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS user_refresh_tokens (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash text NOT NULL,
        token_salt text NOT NULL,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz
      );
    `);

    await this.query(`
      CREATE INDEX IF NOT EXISTS user_refresh_tokens_user_active_idx
      ON user_refresh_tokens (user_id, expires_at DESC)
      WHERE revoked_at IS NULL;
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
      CREATE TABLE IF NOT EXISTS user_mascot_profiles (
        user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        equipped_head_item_id text,
        equipped_eyes_item_id text,
        equipped_glasses_id text,
        equipped_hat_id text,
        equipped_bandana_id text,
        equipped_eye_patch_id text,
        owned_item_ids text[] NOT NULL DEFAULT '{}',
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await this.query(`
      ALTER TABLE user_mascot_profiles
      ADD COLUMN IF NOT EXISTS equipped_head_item_id text,
      ADD COLUMN IF NOT EXISTS equipped_eyes_item_id text;
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
      CREATE TABLE IF NOT EXISTS user_saved_articles (
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        article_id integer NOT NULL,
        title text NOT NULL,
        extract text NOT NULL,
        url text NOT NULL,
        thumbnail_url text,
        saved_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, article_id)
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS user_recent_articles (
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        article_id integer NOT NULL,
        title text NOT NULL,
        extract text NOT NULL,
        url text NOT NULL,
        thumbnail_url text,
        opened_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, article_id)
      );
    `);

    await this.query(`
      CREATE INDEX IF NOT EXISTS user_saved_articles_user_saved_at_idx
      ON user_saved_articles (user_id, saved_at DESC);
    `);

    await this.query(`
      CREATE INDEX IF NOT EXISTS user_recent_articles_user_opened_at_idx
      ON user_recent_articles (user_id, opened_at DESC);
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS dictionary_words (
        id uuid PRIMARY KEY,
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        word text NOT NULL,
        normalized_word text NOT NULL,
        translation text NOT NULL,
        context text NOT NULL,
        progress text NOT NULL DEFAULT 'new',
        last_reviewed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await this.query(`
      ALTER TABLE dictionary_words
      ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz,
      ADD COLUMN IF NOT EXISTS correct_answers_count integer NOT NULL DEFAULT 0;
    `);

    await this.query(`
      ALTER TABLE dictionary_words
      DROP CONSTRAINT IF EXISTS dictionary_words_normalized_word_key;
    `);

    await this.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS dictionary_words_user_id_normalized_word_idx
      ON dictionary_words (user_id, normalized_word)
      WHERE user_id IS NOT NULL;
    `);

    await this.query(`
      CREATE INDEX IF NOT EXISTS dictionary_words_user_id_created_at_idx
      ON dictionary_words (user_id, created_at DESC)
      WHERE user_id IS NOT NULL;
    `);

    await this.query(`
      UPDATE dictionary_words
      SET correct_answers_count = CASE
        WHEN progress = 'learned' THEN 5
        WHEN progress = 'in_progress' AND correct_answers_count = 0 THEN 1
        ELSE correct_answers_count
      END;
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS user_streak_profiles (
        user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        current_streak integer NOT NULL DEFAULT 0,
        longest_streak integer NOT NULL DEFAULT 0,
        last_activity_date date,
        freeze_tokens integer NOT NULL DEFAULT 1,
        timezone text NOT NULL DEFAULT 'UTC',
        broken_streak_info jsonb,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS user_streak_history (
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_date date NOT NULL,
        status text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, activity_date)
      );
    `);

    await this.query(`
      CREATE INDEX IF NOT EXISTS user_streak_history_user_date_idx
      ON user_streak_history (user_id, activity_date DESC);
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS user_streak_achievements (
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        milestone integer NOT NULL,
        reward_coins integer NOT NULL,
        claimed_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, milestone)
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS user_notification_preferences (
        user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        learning_reminders_enabled boolean NOT NULL DEFAULT false,
        learning_reminder_time text NOT NULL DEFAULT '19:00',
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS user_push_tokens (
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_id text NOT NULL,
        push_token text,
        provider text NOT NULL DEFAULT 'fcm',
        platform text NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        last_seen_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, device_id)
      );
    `);

    await this.query(`
      ALTER TABLE user_push_tokens
      ADD COLUMN IF NOT EXISTS push_token text,
      ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'fcm';
    `);

    await this.query(
      `
      ALTER TABLE user_push_tokens
      ALTER COLUMN expo_push_token DROP NOT NULL;
    `,
    ).catch((error: unknown) => {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : '';

      if (code !== '42703') {
        throw error;
      }
    });

    await this.query(`
      UPDATE user_push_tokens
      SET provider = 'expo'
      WHERE push_token IS NULL
        AND EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'user_push_tokens'
            AND column_name = 'expo_push_token'
        );
    `);

    await this.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS user_push_tokens_push_token_idx
      ON user_push_tokens (push_token)
      WHERE push_token IS NOT NULL;
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS user_learning_reminder_dispatches (
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reminder_date date NOT NULL,
        sent_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, reminder_date)
      );
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
