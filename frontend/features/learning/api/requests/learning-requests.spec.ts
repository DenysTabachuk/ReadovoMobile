import { api } from '@/features/auth';
import { getLearningCatalogue } from './getLearningCatalogue';
import { getLearningLesson } from './getLearningLesson';
import { checkReadingAnswer } from './checkReadingAnswer';
import {
  createCatalogue,
  createLesson,
} from '../../testing/learningResponseFixtures';

jest.mock('@/features/auth', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));
afterEach(() => jest.resetAllMocks());

it('accepts a catalogue root and rejects malformed entries', async () => {
  jest.mocked(api.get).mockResolvedValue({ data: createCatalogue() });
  expect(await getLearningCatalogue('uk')).toEqual(createCatalogue());
  jest.mocked(api.get).mockResolvedValue({
    data: { ...createCatalogue(), topics: [{ slug: 5 }] },
  });
  await expect(getLearningCatalogue('en', 'germany')).rejects.toThrow(
    'Invalid learning catalogue response',
  );
  expect(api.get).toHaveBeenLastCalledWith('/learning/catalogue', {
    params: { locale: 'en', topic: 'germany' },
  });
});
it('accepts explicit level unavailability and rejects malformed variants', async () => {
  const lesson = createLesson();
  jest.mocked(api.get).mockResolvedValue({ data: lesson });
  await expect(
    getLearningLesson({ slug: 'a-day', level: 'A1', locale: 'uk' }),
  ).resolves.toEqual(lesson);
  jest
    .mocked(api.get)
    .mockResolvedValue({ data: { ...lesson, variant: null } });
  await expect(
    getLearningLesson({ slug: 'a-day', level: 'B2', locale: 'uk' }),
  ).resolves.toHaveProperty('variant', null);
  jest.mocked(api.get).mockResolvedValue({
    data: {
      ...lesson,
      variant: { ...lesson.variant, readingParagraphs: [null] },
    },
  });
  await expect(
    getLearningLesson({ slug: 'a-day', level: 'A1', locale: 'en' }),
  ).rejects.toThrow('Invalid learning lesson response');
});
it('sends the selected choice and rejects malformed feedback', async () => {
  const input = {
    slug: 'a-day',
    level: 'A1',
    questionId: 'weather',
    optionId: 'sun',
  } as const;
  const feedback = {
    questionId: 'weather',
    selectedOptionId: 'sun',
    correctOptionId: 'rain',
    isCorrect: false,
    explanation: 'It is raining.',
  };
  jest.mocked(api.post).mockResolvedValue({ data: feedback });
  await expect(checkReadingAnswer(input)).resolves.toEqual(feedback);
  expect(api.post).toHaveBeenCalledWith(
    '/learning/lessons/a-day/questions/weather/check',
    { optionId: 'sun' },
    { params: { level: 'A1' } },
  );
  jest.mocked(api.post).mockResolvedValue({
    data: { ...feedback, isCorrect: 'false' },
  });
  await expect(checkReadingAnswer(input)).rejects.toThrow(
    'Invalid reading answer response',
  );
});
