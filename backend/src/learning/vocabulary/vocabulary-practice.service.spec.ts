import { PrismaService } from '../../prisma/prisma.service';
import { VocabularyPracticeService } from './vocabulary-practice.service';
import { createPracticeStage, VARIANT_ID } from './testing/fixtures';

describe('Thematic vocabulary practice persistence', () => {
  let prisma: PrismaService;
  let service: VocabularyPracticeService;

  beforeEach(() => {
    prisma = new PrismaService();
    service = new VocabularyPracticeService(prisma);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await prisma.$disconnect();
  });

  it('rejects persisted choices outside the practice roster', async () => {
    const stage = { ...createPracticeStage('practise-first'), words: [] };
    jest
      .spyOn(prisma.vocabularyLessonStage, 'findMany')
      .mockResolvedValue([stage]);
    await expect(service.getContent(VARIANT_ID)).rejects.toThrow(
      'Invalid stored',
    );
  });

  it('scopes answers to the requested variant and returns the submitted choice', async () => {
    const exercise = createPracticeStage('practise-first').exercises[0];
    const read = jest
      .spyOn(prisma.vocabularyExercise, 'findFirst')
      .mockResolvedValue(exercise);
    const feedback = await service.checkAnswer(
      VARIANT_ID,
      exercise.id,
      'pencil',
    );

    expect(read).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: exercise.id,
          variantId: VARIANT_ID,
          stage: { kind: 'practice', variant: { publishedAt: { not: null } } },
        },
      }),
    );
    expect(feedback).toMatchObject({
      questionId: exercise.id,
      selectedOptionId: 'pencil',
      isCorrect: false,
    });
  });

  it('rejects a persisted exercise whose choices omit the correct answer', async () => {
    const exercise = createPracticeStage('practise-first').exercises[0];
    exercise.options = exercise.options.filter(
      (option) => option.wordId !== exercise.correctWordId,
    );
    jest
      .spyOn(prisma.vocabularyExercise, 'findFirst')
      .mockResolvedValue(exercise);
    await expect(
      service.checkAnswer(VARIANT_ID, exercise.id, 'book'),
    ).rejects.toThrow('Invalid stored');
  });
});
