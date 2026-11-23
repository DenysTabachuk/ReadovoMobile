import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../src/generated/prisma/client';
import { OKTOBERFEST_VOCABULARY_SEED } from './oktoberfest-vocabulary';
import { OKTOBERFEST_THEMATIC_LESSON_SEED } from './oktoberfest-thematic-lesson';
import { seedThematicLesson } from './seed-thematic-lesson';

it('rejects invalid content before opening a database transaction', async () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: 'postgresql://unused:unused@localhost/unused',
    }),
  });
  const transaction = jest.spyOn(prisma, '$transaction');
  try {
    const invalid = structuredClone(OKTOBERFEST_VOCABULARY_SEED);
    const question = invalid.stages[1].exercises[0];
    question.optionWordIds = question.optionWordIds.filter(
      (wordId) => wordId !== question.correctWordId,
    );
    await expect(
      seedThematicLesson(prisma, OKTOBERFEST_THEMATIC_LESSON_SEED, invalid),
    ).rejects.toThrow('Correct word is missing');
    expect(transaction).not.toHaveBeenCalled();
  } finally {
    transaction.mockRestore();
    await prisma.$disconnect();
  }
});
