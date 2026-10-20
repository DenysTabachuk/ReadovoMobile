import {
  QueryClient,
  type MutationObserverOptions,
} from '@tanstack/react-query';

import { submitDictionaryTestAnswer } from '../../requests/submitDictionaryTestAnswer';
import type {
  DictionaryTestAnswerResult,
  SubmitDictionaryTestAnswerRequest,
} from '../../types';
import { useSubmitDictionaryTestAnswerMutation } from '.';

const mockQueryClient = new QueryClient();
const mockSubmitAnswer = jest.mocked(submitDictionaryTestAnswer);
const OWNER_WORDS = ['dictionary', 'words', 'reader-1'];
const OTHER_WORDS = ['dictionary', 'words', 'reader-2'];
const OWNER_ACHIEVEMENTS = ['achievements-profile', 'reader-1'];
const ANSWER = { wordId: 'word-7', selectedOptionId: 'option-1' };
const RESULT: DictionaryTestAnswerResult = {
  correctOptionId: 'option-1',
  correctTranslation: 'сонце',
  isCorrect: true,
  word: {
    id: 'word-7',
    word: 'sun',
    translation: 'сонце',
    context: 'The sun rises.',
    userId: 'reader-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    correctAnswersCount: 1,
    requiredCorrectAnswers: 3,
    progress: 'in_progress',
  },
};

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ currentUser: { id: 'reader-1' } }),
}));
jest.mock('../../requests/submitDictionaryTestAnswer', () => ({
  submitDictionaryTestAnswer: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  return {
    ...actual,
    useQueryClient: () => mockQueryClient,
    useMutation: (
      options: MutationObserverOptions<
        DictionaryTestAnswerResult,
        Error,
        SubmitDictionaryTestAnswerRequest
      >,
    ) => {
      const observer = new actual.MutationObserver(mockQueryClient, options);
      return { mutateAsync: observer.mutate.bind(observer) };
    },
  };
});

describe('useSubmitDictionaryTestAnswerMutation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockQueryClient.setQueryData(OWNER_WORDS, ['owner-word']);
    mockQueryClient.setQueryData(OTHER_WORDS, ['other-word']);
    mockQueryClient.setQueryData(OWNER_ACHIEVEMENTS, { balance: 42 });
  });
  afterEach(() => mockQueryClient.clear());

  it.each([true, false])(
    'returns feedback and invalidates only owner words (correct=%s)',
    async (isCorrect) => {
      const result = { ...RESULT, isCorrect };
      mockSubmitAnswer.mockResolvedValue(result);
      const mutation = useSubmitDictionaryTestAnswerMutation();
      await expect(mutation.mutateAsync(ANSWER)).resolves.toBe(result);
      expect(mockSubmitAnswer.mock.calls[0][0]).toEqual(ANSWER);
      expect(mockQueryClient.getQueryState(OWNER_WORDS)?.isInvalidated).toBe(
        true,
      );
      expect(mockQueryClient.getQueryState(OTHER_WORDS)?.isInvalidated).toBe(
        false,
      );
      expect(
        mockQueryClient.getQueryState(OWNER_ACHIEVEMENTS)?.isInvalidated,
      ).toBe(false);
      expect(mockQueryClient.getQueryData(OWNER_WORDS)).toEqual(['owner-word']);
    },
  );

  it('propagates submission errors and leaves cached data valid', async () => {
    const error = new Error('dictionary.test.answerError');
    mockSubmitAnswer.mockRejectedValue(error);
    const mutation = useSubmitDictionaryTestAnswerMutation();
    await expect(mutation.mutateAsync(ANSWER)).rejects.toBe(error);
    expect(mockQueryClient.getQueryState(OWNER_WORDS)?.isInvalidated).toBe(
      false,
    );
    expect(mockQueryClient.getQueryState(OTHER_WORDS)?.isInvalidated).toBe(
      false,
    );
  });
});
