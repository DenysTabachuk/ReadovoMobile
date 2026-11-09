import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../src/generated/prisma/client';
import { COMMON_THINGS_SEED } from './common-things';
import { importVocabularySeed } from './import';

it('rejects invalid content before opening a database transaction', async () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: 'postgresql://unused:unused@localhost/unused',
    }),
  });
  const transaction = jest.spyOn(prisma, '$transaction');
  try {
    const invalid = structuredClone(COMMON_THINGS_SEED);
    invalid.stages[1].exercises[0].optionWordIds = ['book', 'pencil'];
    await expect(importVocabularySeed(prisma, invalid)).rejects.toThrow(
      'Correct word is missing',
    );
    expect(transaction).not.toHaveBeenCalled();
  } finally {
    transaction.mockRestore();
    await prisma.$disconnect();
  }
});
