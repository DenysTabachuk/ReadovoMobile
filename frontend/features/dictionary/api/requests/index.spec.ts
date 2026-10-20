import { authenticatedFetch } from '@/features/auth';
import {
  createDictionaryWord,
  deleteDictionaryWord,
  fetchDictionaryTest,
  fetchDictionaryWords,
  submitDictionaryTestAnswer,
  updateDictionaryWordProgress,
} from '.';

jest.mock('@/api', () => ({ API_BASE_URL: 'https://api.example.test' }));
jest.mock('@/features/auth', () => ({ authenticatedFetch: jest.fn() }));

const mockFetch = jest.mocked(authenticatedFetch);
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
      mockFetch.mockResolvedValue(new Response(JSON.stringify(responseBody)));
      await expect(run()).resolves.toEqual(responseBody);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(`https://api.example.test/api/dictionary/me${path}`);
      expect(options?.method ?? 'GET').toBe(method);
      expect(options?.body).toBe(body ? JSON.stringify(body) : undefined);
    },
  );

  it.each([
    { run: fetchDictionaryWords, error: 'dictionary.error' },
    {
      run: () => deleteDictionaryWord('word-7'),
      error: 'dictionary.deleteError',
    },
    {
      run: () =>
        updateDictionaryWordProgress('word-7', { progress: 'in_progress' }),
      error: 'dictionary.progressUpdateError',
    },
    { run: fetchDictionaryTest, error: 'dictionary.test.error' },
    {
      run: () => submitDictionaryTestAnswer(answer),
      error: 'dictionary.test.answerError',
    },
    { run: () => createDictionaryWord(word), error: 'dictionary.saveError' },
  ])('preserves the error contract $error', async ({ run, error }) => {
    mockFetch.mockResolvedValue(new Response('{}', { status: 401 }));
    await expect(run()).rejects.toThrow(error);
  });

  it('preserves the duplicate-word response', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'Word or phrase already exists in dictionary.',
        }),
        { status: 409 },
      ),
    );
    await expect(createDictionaryWord(word)).rejects.toThrow(
      'dictionary.alreadyExists',
    );
  });
});
