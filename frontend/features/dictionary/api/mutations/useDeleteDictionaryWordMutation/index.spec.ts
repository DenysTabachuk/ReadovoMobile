import { deleteDictionaryWord } from '../../requests/deleteDictionaryWord';
import { useDeleteDictionaryWordMutation } from '.';

type MutationOptions = {
  mutationFn: (wordId: string) => Promise<unknown>;
  onSuccess: () => void;
};

let mockOptions: MutationOptions;
const mockShowBanner = jest.fn();
const mockInvalidateQueries = jest.fn();
let mockUserId: string | null | undefined = 'user-42';

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    currentUser: { id: mockUserId },
  }),
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
    useDeleteDictionaryWordMutation();
  });

  it('deletes the requested word for the dictionary owner', async () => {
    await mockOptions.mutationFn('word-7');
    expect(deleteDictionaryWord).toHaveBeenCalledWith('word-7');
  });

  it('leaves UI feedback to the caller and refreshes only the owner dictionary on success', () => {
    mockOptions.onSuccess();
    expect(mockInvalidateQueries.mock.calls).toEqual([
      [{ queryKey: ['dictionary', 'words', 'user-42'] }],
    ]);
    expect(mockShowBanner).not.toHaveBeenCalled();
  });

  it('leaves caches and UI untouched when the request fails', async () => {
    const failure = new Error('Offline');
    jest.mocked(deleteDictionaryWord).mockRejectedValueOnce(failure);
    await expect(mockOptions.mutationFn('word-7')).rejects.toBe(failure);
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
    expect(mockShowBanner).not.toHaveBeenCalled();
  });
});
