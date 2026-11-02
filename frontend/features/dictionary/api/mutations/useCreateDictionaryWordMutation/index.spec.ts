import type { CreateDictionaryWordRequest } from '../../types';
import { createDictionaryWord } from '../../requests/createDictionaryWord';
import { useCreateDictionaryWordMutation } from '.';

type MutationOptions = {
  mutationFn: (request: CreateDictionaryWordRequest) => Promise<unknown>;
  onSuccess: () => void;
};

let mockOptions: MutationOptions;
const mockShowBanner = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock('@/components/banner', () => ({
  useBanner: () => ({ showBanner: mockShowBanner }),
}));
jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    currentUser: { id: 'user-42' },
  }),
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

  it('refreshes the owner dictionary without displaying screen feedback', () => {
    mockOptions.onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['dictionary', 'words', 'user-42'],
    });
    expect(mockShowBanner).not.toHaveBeenCalled();
  });
});
