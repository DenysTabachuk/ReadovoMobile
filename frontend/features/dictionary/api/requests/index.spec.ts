import { HttpError } from '@/api/httpError';
import { createHttpResponse } from '@/api/testing/http';
import { api } from '@/features/auth';
import {
  createDictionaryWord,
  deleteDictionaryWord,
  fetchDictionaryTest,
  fetchDictionaryWords,
  submitDictionaryTestAnswer,
  updateDictionaryWordProgress,
} from '.';

jest.mock('@/api', () => ({ API_BASE_URL: 'https://api.example.test' }));
jest.mock('@/features/auth', () => {
  const request = jest.fn();
  const withBody =
    (method: string) =>
    (url: string, data: unknown, config?: Record<string, unknown>) =>
      request(url, { ...config, method, data });
  return {
    api: Object.assign(request, {
      get: (url: string, config?: Record<string, unknown>) =>
        config ? request(url, config) : request(url),
      delete: (url: string, config?: Record<string, unknown>) =>
        request(url, { ...config, method: 'DELETE' }),
      post: withBody('POST'),
      put: withBody('PUT'),
      patch: withBody('PATCH'),
    }),
  };
});

const mockFetch = jest.mocked(api);
const word = { word: 'sun', translation: 'сонце', context: 'The sun rises.' };
const answer = { wordId: 'word-7', selectedOptionId: 'option-1' };

describe('authenticated dictionary request contract', () => {
  beforeEach(() => jest.resetAllMocks());

  it.each([
    {
      name: 'list words',
      run: fetchDictionaryWords,
      path: '/words',
      method: 'GET',
      body: undefined,
    },
    {
      name: 'create word',
      run: () => createDictionaryWord(word),
      path: '/words',
      method: 'POST',
      body: word,
    },
    {
      name: 'delete word',
      run: () => deleteDictionaryWord('word-7'),
      path: '/words/word-7',
      method: 'DELETE',
      body: undefined,
    },
    {
      name: 'update progress',
      run: () =>
        updateDictionaryWordProgress('word-7', { progress: 'in_progress' }),
      path: '/words/word-7/progress',
      method: 'PATCH',
      body: { progress: 'in_progress' },
    },
    {
      name: 'create test',
      run: fetchDictionaryTest,
      path: '/test?limit=10',
      method: 'GET',
      body: undefined,
    },
    {
      name: 'submit answer',
      run: () => submitDictionaryTestAnswer(answer),
      path: '/test/answer',
      method: 'POST',
      body: answer,
    },
  ])(
    '$name uses the authenticated /me endpoint',
    async ({ run, path, method, body }) => {
      const responseBody = { result: 'server-response' };
      mockFetch.mockResolvedValue(
        createHttpResponse(JSON.stringify(responseBody)),
      );
      await expect(run()).resolves.toEqual(responseBody);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(`/api/dictionary/me${path}`);
      expect(options?.method ?? 'GET').toBe(method);
      expect(options?.data).toEqual(body);
    },
  );

  it.each([
    { run: fetchDictionaryWords, error: 'dictionary.error' },
    {
      run: () => deleteDictionaryWord('word-7'),
    },
    {
      run: () =>
        updateDictionaryWordProgress('word-7', { progress: 'in_progress' }),
    },
    { run: fetchDictionaryTest, error: 'dictionary.test.error' },
    {
      run: () => submitDictionaryTestAnswer(answer),
    },
    { run: () => createDictionaryWord(word), error: 'dictionary.saveError' },
  ])('preserves HTTP failures for presentation', async ({ run }) => {
    mockFetch.mockRejectedValue(
      new HttpError(createHttpResponse('{}', { status: 401 })),
    );
    await expect(run()).rejects.toBeInstanceOf(HttpError);
  });

  it('preserves the duplicate-word response', async () => {
    mockFetch.mockRejectedValue(
      new HttpError(
        createHttpResponse(
          {
            code: 'DICTIONARY_WORD_ALREADY_EXISTS',
            message: 'Changed backend wording',
          },
          { status: 400 },
        ),
      ),
    );
    await expect(createDictionaryWord(word)).rejects.toMatchObject({
      status: 400,
      code: 'DICTIONARY_WORD_ALREADY_EXISTS',
    });
  });
});
