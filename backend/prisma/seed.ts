import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { COMMON_THINGS_SEED } from './seeds/vocabulary/common-things';
import { importVocabularySeed } from './seeds/vocabulary/import';

// Explicit development/test database population; does not publish real lessons.
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    const lessonId = await importVocabularySeed(prisma, COMMON_THINGS_SEED);
    console.log(
      `Imported Common Things TEST DATA as an unpublished draft (${lessonId}).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
