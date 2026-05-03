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
        created_at timestamptz NOT NULL DEFAULT now()
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
        created_at timestamptz NOT NULL DEFAULT now()
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
