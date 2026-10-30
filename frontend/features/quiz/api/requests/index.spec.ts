import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';
import { api } from '@/features/auth';
import { completeQuiz } from './completeQuiz';
import { submitQuizAnswer } from './submitQuizAnswer';
import { retakeQuiz } from './retakeQuiz';

jest.mock('@/api/config', () => ({ API_BASE_URL: 'https://api.example.test' }));
jest.mock('@/features/auth', () => ({
  api: jest.requireActual<typeof import('@/api/httpClient')>('@/api/httpClient')
    .httpClient,
}));

it('sends only selected answer identifiers for the saved session', async () => {
  const feedback = {
    isCorrect: true,
    correctOptionIds: ['a'],
    vocabularyWord: {
      term: 'forest',
      translation: 'ліс',
      sourceExcerpt: 'The forest protects animals.',
    },
  };
  const adapter = mockHttpAdapter(api).mockResolvedValue(
    createHttpResponse(feedback),
  );
  await expect(
    submitQuizAnswer({
      sessionId: 'session-1',
      questionId: 'q-1',
      selectedOptionIds: ['a'],
    }),
  ).resolves.toEqual(feedback);
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/quiz-sessions/session-1/answers',
    method: 'post',
    data: '{"questionId":"q-1","selectedOptionIds":["a"]}',
  });
});

it('sends no score, balance, counters, or reward in completion requests', async () => {
  const adapter = mockHttpAdapter(api).mockResolvedValue(
    createHttpResponse({ sessionId: 'session-1' }),
  );
  await completeQuiz('session-1');
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/quiz-sessions/session-1/complete',
    method: 'post',
    data: JSON.stringify({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });
});

it('requests a distinct server session for a legitimate retake', async () => {
  const adapter = mockHttpAdapter(api).mockResolvedValue(
    createHttpResponse({ sessionId: 'session-2' }),
  );
  await expect(retakeQuiz('session-1')).resolves.toBe('session-2');
  expect(adapter.mock.calls[0][0]).toMatchObject({
    url: '/quiz-sessions/session-1/retake',
    method: 'post',
  });
});
