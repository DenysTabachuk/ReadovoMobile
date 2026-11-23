import { api } from '@/features/auth';
import { checkVocabularyAnswer } from '.';
import { createVocabularyFeedback } from '../../../testing/practiceFixtures';

jest.mock('@/features/auth', () => ({ api: { post: jest.fn() } }));
afterEach(() => jest.resetAllMocks());

it('submits the question and choice and returns validated feedback', async () => {
  const feedback = createVocabularyFeedback(0, 'word-2');
  jest.mocked(api.post).mockResolvedValue({ data: feedback });
  const submission = { questionId: 'exercise-1', optionId: 'word-2' };
  expect(await checkVocabularyAnswer('oktoberfest', 'A1', submission)).toEqual(
    feedback,
  );
  expect(api.post).toHaveBeenCalledWith(
    '/learning/lessons/oktoberfest/vocabulary/exercises/exercise-1/check',
    { optionId: 'word-2' },
    { params: { level: 'A1' } },
  );
});

it('rejects malformed successful feedback before it reaches mutation callbacks', async () => {
  jest.mocked(api.post).mockResolvedValue({
    data: { ...createVocabularyFeedback(0, 'word-2'), isCorrect: 'false' },
  });
  await expect(
    checkVocabularyAnswer('oktoberfest', 'A1', {
      questionId: 'exercise-1',
      optionId: 'word-2',
    }),
  ).rejects.toThrow('Invalid vocabulary answer response');
});
