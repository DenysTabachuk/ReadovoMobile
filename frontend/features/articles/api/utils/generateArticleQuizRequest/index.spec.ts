import { type GenericAbortSignal } from 'axios';
import { createHttpResponse, mockHttpAdapter } from '@/api/testing/http';
import { generateArticleQuizRequest } from '.';

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
    const fetchMock = mockHttpAdapter().mockResolvedValue(
      createHttpResponse(payload),
    );
    await expect(
      generateArticleQuizRequest('/api/articles/quiz', request),
    ).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://api.example.test/api/articles/quiz',
        method: 'post',
        data: JSON.stringify(request),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        signal: expect.any(AbortSignal),
      }),
    );
    expect(jest.getTimerCount()).toBe(0);
  });
  it('preserves HTTP and network failures and clears timers', async () => {
    const fetchMock = mockHttpAdapter().mockResolvedValue(
      createHttpResponse('Unavailable', { status: 503 }),
    );
    await expect(
      generateArticleQuizRequest('/api/articles/quiz', request),
    ).rejects.toMatchObject({ status: 503 });
    const offline = new Error('Offline');
    fetchMock.mockRejectedValueOnce(offline);
    await expect(
      generateArticleQuizRequest('/api/articles/quiz', request),
    ).rejects.toBe(offline);
    expect(jest.getTimerCount()).toBe(0);
  });
  it('aborts a hanging request at 60 seconds and rejects with TimeoutError', async () => {
    let signal: GenericAbortSignal | undefined;
    mockHttpAdapter().mockImplementation(
      (init) =>
        new Promise((_resolve, reject) => {
          signal = init.signal;
          signal?.addEventListener?.('abort', () =>
            reject(new Error('Aborted')),
          );
        }),
    );
    const pending = generateArticleQuizRequest('/api/articles/quiz', request);
    const assertion = expect(pending).rejects.toMatchObject({
      name: 'TimeoutError',
    });
    await jest.advanceTimersByTimeAsync(59_999);
    expect(signal?.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await assertion;
    expect(signal?.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });
  it('propagates invalid JSON without leaking a timer', async () => {
    mockHttpAdapter().mockResolvedValue(createHttpResponse('invalid JSON'));
    await expect(
      generateArticleQuizRequest('/api/articles/quiz', request),
    ).rejects.toThrow();
    expect(jest.getTimerCount()).toBe(0);
  });
});
