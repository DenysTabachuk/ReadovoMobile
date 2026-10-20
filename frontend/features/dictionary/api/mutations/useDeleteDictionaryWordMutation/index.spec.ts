import { deleteDictionaryWord } from '../../requests/deleteDictionaryWord';
import { useDeleteDictionaryWordMutation } from '.';

type MutationOptions = {
  mutationFn: (wordId: string) => Promise<unknown>;
  onError: () => void;
  onSuccess: () => void;
};

let mockOptions: MutationOptions;
const mockShowBanner = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockOnSuccess = jest.fn();
let mockUserId: string | null | undefined = 'user-42';

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ currentUser: { id: mockUserId } }),
}));
jest.mock('@/components/banner', () => ({
  useBanner: () => ({ showBanner: mockShowBanner }),
}));
jest.mock('../../requests/deleteDictionaryWord', () => ({
  deleteDictionaryWord: jest.fn(),
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

describe('useDeleteDictionaryWordMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'user-42';
    useDeleteDictionaryWordMutation({
      onSuccess: mockOnSuccess,
    });
  });

  it('deletes the requested word for the dictionary owner', async () => {
    await mockOptions.mutationFn('word-7');
    expect(deleteDictionaryWord).toHaveBeenCalledWith('word-7');
  });

  it('closes the UI and refreshes only the owner dictionary on success', () => {
    mockOptions.onSuccess();
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    expect(mockInvalidateQueries.mock.calls).toEqual([
      [{ queryKey: ['dictionary', 'words', 'user-42'] }],
    ]);
    expect(mockShowBanner).toHaveBeenCalledWith({
      durationMs: 3200,
      title: 'dictionary.deleted',
      variant: 'success',
    });
  });

  it('preserves the open UI and cache on failure and reports the error', () => {
    mockOptions.onError();
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
    expect(mockShowBanner).toHaveBeenCalledWith({
      description: 'dictionary.deleteErrorDescription',
      durationMs: 4200,
      title: 'dictionary.deleteError',
      variant: 'error',
    });
  });
});
