import { updateDictionaryWordProgress } from '../../requests/updateDictionaryWordProgress';
import type { DictionaryWordProgress } from '../../types';
import { useUpdateDictionaryWordProgressMutation } from '.';

type MutationOptions = {
  mutationFn: (variables: {
    wordId: string;
    progress: DictionaryWordProgress;
  }) => Promise<unknown>;
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
jest.mock('../../requests/updateDictionaryWordProgress', () => ({
  updateDictionaryWordProgress: jest.fn(),
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

describe('useUpdateDictionaryWordProgressMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'user-42';
    useUpdateDictionaryWordProgressMutation();
  });

  it('updates the requested word progress for the dictionary owner', async () => {
    await mockOptions.mutationFn({
      wordId: 'word-7',
      progress: 'in_progress',
    });
    expect(updateDictionaryWordProgress).toHaveBeenCalledWith('word-7', {
      progress: 'in_progress',
    });
  });

  it('leaves UI feedback to the caller and refreshes dictionary and achievements on success', () => {
    mockOptions.onSuccess();
    expect(mockInvalidateQueries.mock.calls).toEqual([
      [{ queryKey: ['dictionary', 'words', 'user-42'] }],
      [{ queryKey: ['achievements-profile', 'user-42'] }],
    ]);
    expect(mockShowBanner).not.toHaveBeenCalled();
  });

  it.each([undefined, null])(
    'does not invalidate achievements when the dictionary owner is %s',
    (userId) => {
      mockUserId = userId;
      useUpdateDictionaryWordProgressMutation();
      mockOptions.onSuccess();
      expect(mockInvalidateQueries.mock.calls).toEqual([
        [{ queryKey: ['dictionary', 'words', userId] }],
      ]);
    },
  );

  it('leaves caches and UI untouched when the request fails', async () => {
    const failure = new Error('Offline');
    jest.mocked(updateDictionaryWordProgress).mockRejectedValueOnce(failure);
    await expect(
      mockOptions.mutationFn({ wordId: 'word-7', progress: 'in_progress' }),
    ).rejects.toBe(failure);
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
    expect(mockShowBanner).not.toHaveBeenCalled();
  });
});
