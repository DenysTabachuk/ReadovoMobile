import { HttpError } from '@/api/httpError';
import type { CreateDictionaryWordRequest } from '../../types';
import { createDictionaryWord } from '../../requests/createDictionaryWord';
import { useCreateDictionaryWordMutation } from '.';

type MutationOptions = {
  mutationFn: (request: CreateDictionaryWordRequest) => Promise<unknown>;
  onError: (error: unknown) => void;
  onSuccess: () => void;
};

let mockOptions: MutationOptions;
const mockShowBanner = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock('@/components/banner', () => ({
  useBanner: () => ({ showBanner: mockShowBanner }),
}));
jest.mock('@/features/auth', () => ({
  useAuth: () => ({ currentUser: { id: 'user-42' } }),
}));
jest.mock('../../requests/createDictionaryWord', () => ({
  createDictionaryWord: jest.fn(),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  useMutation: (options: MutationOptions) => {
    mockOptions = options;
    return {};
  },
}));

describe('useCreateDictionaryWordMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCreateDictionaryWordMutation();
  });

  it('saves the selected word and context for the authenticated user', async () => {
    const request = {
      context: 'A bright day.',
      word: 'bright',
      translation: 'яскравий',
    };
    await mockOptions.mutationFn(request);
    expect(createDictionaryWord).toHaveBeenCalledWith(request);
  });

  it('refreshes the user dictionary and shows a success banner', () => {
    mockOptions.onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['dictionary', 'words', 'user-42'],
    });
    expect(mockShowBanner).toHaveBeenCalledWith({
      title: 'dictionary.saved',
      variant: 'success',
    });
  });

  it('shows duplicate words as information', () => {
    mockOptions.onError(
      new HttpError({
        status: 400,
        data: { code: 'DICTIONARY_WORD_ALREADY_EXISTS', message: 'Changed' },
      }),
    );
    expect(mockShowBanner).toHaveBeenCalledWith({
      title: 'dictionary.alreadyExists',
      variant: 'info',
    });
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });

  it('uses generic feedback for non-Error failures', () => {
    mockOptions.onError(null);
    expect(mockShowBanner).toHaveBeenCalledWith({
      title: 'errors.generic',
      variant: 'error',
    });
  });
  it('keeps session cancellation silent', () => {
    mockOptions.onError(Object.assign(new Error(), { name: 'AbortError' }));
    expect(mockShowBanner).not.toHaveBeenCalled();
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });
});
