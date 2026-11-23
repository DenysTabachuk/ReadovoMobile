import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { OKTOBERFEST_THEMATIC_LESSON_SEED } from './seeds/learning/oktoberfest-thematic-lesson';
import { OKTOBERFEST_VOCABULARY_SEED } from './seeds/learning/oktoberfest-vocabulary';
import { seedThematicLesson } from './seeds/learning/seed-thematic-lesson';

// Explicit development/test database population; visible sample, not approved production content.
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    await seedThematicLesson(
      prisma,
      OKTOBERFEST_THEMATIC_LESSON_SEED,
      OKTOBERFEST_VOCABULARY_SEED,
    );
    console.log('Seeded Oktoberfest TEST DATA.');
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
