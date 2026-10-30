import {
  QueryClient,
  type MutationObserverOptions,
} from '@tanstack/react-query';

import { fetchDictionaryTest } from '../../requests/fetchDictionaryTest';
import type { DictionaryTest } from '../../types';
import { useGenerateDictionaryTestMutation } from '.';

const mockQueryClient = new QueryClient();
const mockFetchTest = jest.mocked(fetchDictionaryTest);

jest.mock('../../requests/fetchDictionaryTest', () => ({
  fetchDictionaryTest: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  return {
    ...actual,
    useMutation: (
      options: MutationObserverOptions<DictionaryTest, Error, void>,
    ) => {
      const observer = new actual.MutationObserver(mockQueryClient, options);
      return { mutateAsync: observer.mutate.bind(observer) };
    },
  };
});

describe('useGenerateDictionaryTestMutation', () => {
  beforeEach(() => jest.resetAllMocks());
  afterEach(() => mockQueryClient.clear());

  it('does not generate a test until requested', () => {
    const onSuccess = jest.fn();
    useGenerateDictionaryTestMutation({ onSuccess });
    expect(mockFetchTest).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('passes the generated test to the screen only after the request succeeds', async () => {
    const pending = Promise.withResolvers<DictionaryTest>();
    const started = Promise.withResolvers<void>();
    const onSuccess = jest.fn();
    mockFetchTest.mockImplementation(() => {
      started.resolve();
      return pending.promise;
    });
    const mutation = useGenerateDictionaryTestMutation({ onSuccess });
    const result = mutation.mutateAsync();
    await started.promise;
    expect(onSuccess).not.toHaveBeenCalled();
    const test: DictionaryTest = {
      sessionId: 'session-1',
      questions: [
        {
          format: 'translation',
          options: [{ id: 'option-1', text: 'сонце', translation: 'сонце' }],
          prompt: 'Translate sun',
          word: 'sun',
          wordId: 'word-7',
        },
      ],
    };
    pending.resolve(test);
    await expect(result).resolves.toBe(test);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess.mock.calls[0][0]).toBe(test);
  });

  it('propagates generation failures without changing the displayed test', async () => {
    const error = new Error('dictionary.test.error');
    mockFetchTest.mockRejectedValue(error);
    const onSuccess = jest.fn();
    const mutation = useGenerateDictionaryTestMutation({ onSuccess });
    await expect(mutation.mutateAsync()).rejects.toBe(error);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
