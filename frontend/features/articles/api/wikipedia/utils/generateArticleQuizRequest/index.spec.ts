import { generateArticleQuizRequest } from './index';

jest.mock('@/api', () => ({ API_BASE_URL: 'https://api.example.test' }));
const request = {
  title: 'Space',
  text: 'The Moon orbits Earth.',
  level: 'A2' as const,
  targetLength: 'short' as const,
};
describe('generateArticleQuizRequest', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  it('POSTs a quiz request and clears its timeout after parsing the response', async () => {
    const payload = { questions: [] };
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(Response.json(payload));
    await expect(
      generateArticleQuizRequest('/api/articles/quiz', request),
    ).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/articles/quiz',
      {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json' },
        signal: expect.any(AbortSignal),
      },
    );
    expect(jest.getTimerCount()).toBe(0);
  });
  it('maps both HTTP and network failures to the quiz error key and clears timers', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('Unavailable', { status: 503 }));
    await expect(
      generateArticleQuizRequest('/api/articles/quiz', request),
    ).rejects.toThrow('article.quiz.error');
    fetchMock.mockRejectedValueOnce(new Error('Offline'));
    await expect(
      generateArticleQuizRequest('/api/articles/quiz', request),
    ).rejects.toThrow('article.quiz.error');
    expect(jest.getTimerCount()).toBe(0);
  });
  it('aborts a hanging request at 60 seconds and rejects with the quiz error', async () => {
    let signal: AbortSignal | undefined;
    jest.spyOn(global, 'fetch').mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          signal = init?.signal ?? undefined;
          signal?.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    );
    const pending = generateArticleQuizRequest('/api/articles/quiz', request);
    const assertion = expect(pending).rejects.toThrow('article.quiz.error');
    await jest.advanceTimersByTimeAsync(59_999);
    expect(signal?.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await assertion;
    expect(signal?.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });
  it('propagates invalid JSON without leaking a timer', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('invalid JSON'));
    await expect(
      generateArticleQuizRequest('/api/articles/quiz', request),
    ).rejects.toThrow();
    expect(jest.getTimerCount()).toBe(0);
  });
});
