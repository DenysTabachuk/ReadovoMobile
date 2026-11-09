import { PrismaService } from '../prisma/prisma.service';
import { VocabularyService } from './vocabulary.service';

describe('Vocabulary read persistence boundary', () => {
  let prisma: PrismaService;
  let service: VocabularyService;

  beforeEach(() => {
    // Prisma is constructed for its typed delegates; no lifecycle hook connects it.
    prisma = new PrismaService();
    service = new VocabularyService(prisma);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await prisma.$disconnect();
  });

  it('filters drafts from the catalogue and requests deterministic ordering and actual counts', async () => {
    const read = jest
      .spyOn(prisma.vocabularyLesson, 'findMany')
      .mockResolvedValue([]);
    await expect(service.listLessons({ locale: 'en' })).resolves.toEqual({
      lessons: [],
    });
    expect(read).toHaveBeenCalledWith({
      where: { publishedAt: { not: null } },
      orderBy: [{ level: 'asc' }, { slug: 'asc' }],
      include: {
        translations: true,
        _count: { select: { words: true, stages: true } },
      },
    });
  });

  it('applies publication filtering to direct slug reads and never loads answer keys', async () => {
    const read = jest
      .spyOn(prisma.vocabularyLesson, 'findFirst')
      .mockResolvedValue(null);
    await expect(
      service.getLesson('seed-common-things', { locale: 'uk' }),
    ).rejects.toMatchObject({
      response: { code: 'VOCABULARY_LESSON_NOT_FOUND', statusCode: 404 },
    });
    expect(read).toHaveBeenCalledWith({
      where: { slug: 'seed-common-things', publishedAt: { not: null } },
      include: {
        translations: true,
        words: { orderBy: { id: 'asc' } },
        stages: {
          orderBy: { position: 'asc' },
          include: {
            translations: true,
            words: { orderBy: { position: 'asc' } },
            _count: { select: { exercises: true } },
          },
        },
      },
    });
  });
});
