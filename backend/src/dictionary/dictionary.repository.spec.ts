import { PrismaService } from '../prisma/prisma.service';
import { DictionaryRepository } from './dictionary.repository';

describe('DictionaryRepository', () => {
  const delegate = {
    createManyAndReturn: jest.fn(),
    findMany: jest.fn(),
  };
  const repository = new DictionaryRepository({
    dictionaryWord: delegate,
  } as unknown as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  it('normalizes a word before creating it', async () => {
    let receivedNormalizedWord: string | undefined;
    delegate.createManyAndReturn.mockImplementation(
      ({ data }: { data: { normalizedWord: string } }) => {
        receivedNormalizedWord = data.normalizedWord;
        return Promise.resolve([{ ...data, lastReviewedAt: null }]);
      },
    );

    const result = await repository.create({
      context: 'A context',
      correctAnswersCount: 0,
      createdAt: '2026-10-13T10:00:00.000Z',
      id: 'fdd4777f-98d7-44bb-a11e-578db7b77527',
      lastReviewedAt: undefined,
      progress: 'new',
      requiredCorrectAnswers: 5,
      translation: 'translation',
      userId: '3f0429b1-bcc7-4742-b0a2-2c45eaf90d87',
      word: '  Example  ',
    });

    expect(receivedNormalizedWord).toBe('example');
    expect(result).toMatchObject({
      createdAt: '2026-10-13T10:00:00.000Z',
      requiredCorrectAnswers: 5,
      word: '  Example  ',
    });
  });

  it('keeps duplicate creation idempotent', async () => {
    delegate.createManyAndReturn.mockResolvedValue([]);

    await expect(
      repository.create({
        context: 'A context',
        correctAnswersCount: 0,
        createdAt: '2026-10-13T10:00:00.000Z',
        id: 'fdd4777f-98d7-44bb-a11e-578db7b77527',
        lastReviewedAt: undefined,
        progress: 'new',
        requiredCorrectAnswers: 5,
        translation: 'translation',
        userId: '3f0429b1-bcc7-4742-b0a2-2c45eaf90d87',
        word: 'Example',
      }),
    ).resolves.toBeNull();
  });

  it('uses the existing review ordering and limit', async () => {
    delegate.findMany.mockResolvedValue([]);

    await repository.findReviewCandidates('user-1', 12);

    expect(delegate.findMany).toHaveBeenCalledWith({
      orderBy: [
        { lastReviewedAt: { nulls: 'first', sort: 'asc' } },
        { createdAt: 'asc' },
      ],
      take: 12,
      where: { userId: 'user-1' },
    });
  });
});
