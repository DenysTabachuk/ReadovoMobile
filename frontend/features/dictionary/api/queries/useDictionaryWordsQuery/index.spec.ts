import { fetchDictionaryWords } from '../../requests/fetchDictionaryWords';
import { useDictionaryWordsQuery } from '.';

type QueryOptions = {
  enabled: boolean;
  queryKey: unknown[];
  queryFn: () => Promise<unknown>;
};

let mockUserId: string | null | undefined;
let mockOptions: QueryOptions;

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ currentUser: mockUserId ? { id: mockUserId } : null }),
}));
jest.mock('../../requests/fetchDictionaryWords', () => ({
  fetchDictionaryWords: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: (options: QueryOptions) => {
    mockOptions = options;
    return {};
  },
}));

describe('useDictionaryWordsQuery', () => {
  beforeEach(() => jest.clearAllMocks());

  it('isolates cached words between authenticated accounts', async () => {
    mockUserId = 'reader-1';
    useDictionaryWordsQuery();
    expect(mockOptions.enabled).toBe(true);
    expect(mockOptions.queryKey).toEqual(['dictionary', 'words', 'reader-1']);
    await mockOptions.queryFn();
    expect(fetchDictionaryWords).toHaveBeenCalledWith();

    mockUserId = 'reader-2';
    useDictionaryWordsQuery();
    expect(mockOptions.queryKey).toEqual(['dictionary', 'words', 'reader-2']);
  });

  it.each([null, undefined])(
    'disables loading when signed out (%s)',
    (userId) => {
      mockUserId = userId;
      useDictionaryWordsQuery();
      expect(mockOptions.enabled).toBe(false);
      expect(fetchDictionaryWords).not.toHaveBeenCalled();
    },
  );
});
