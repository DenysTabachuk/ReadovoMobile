import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repositoryRoot = resolve(__dirname, '../../..');
const migrationsDirectory = resolve(
  repositoryRoot,
  'backend/prisma/migrations',
);
const databaseName = `readovo_vocab_test_${randomUUID().replaceAll('-', '')}`;

// Only a newly created, uniquely named test database is ever modified or dropped.
if (!/^readovo_vocab_test_[a-f0-9]{32}$/.test(databaseName)) {
  throw new Error('Invalid isolated test database name');
}

function runSql(database: string, sql: string) {
  return execFileSync(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'postgres',
      'psql',
      '-X',
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      'readovo',
      '-d',
      database,
    ],
    {
      cwd: repositoryRoot,
      input: sql,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  );
}

describe('Vocabulary content schema (PostgreSQL integration)', () => {
  it('applies migrations and enforces content relationships and constraints', () => {
    let databaseCreated = false;
    try {
      runSql('postgres', `CREATE DATABASE "${databaseName}";`);
      databaseCreated = true;
      const migrations = readdirSync(migrationsDirectory, {
        withFileTypes: true,
      })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
      for (const migration of migrations) {
        const sql = readFileSync(
          resolve(migrationsDirectory, migration, 'migration.sql'),
          'utf8',
        );
        runSql(databaseName, sql);
      }
      runSql(
        databaseName,
        readFileSync(resolve(__dirname, 'content-schema.sql'), 'utf8'),
      );
    } finally {
      if (databaseCreated)
        runSql('postgres', `DROP DATABASE "${databaseName}" WITH (FORCE);`);
    }
  }, 30000);
});
