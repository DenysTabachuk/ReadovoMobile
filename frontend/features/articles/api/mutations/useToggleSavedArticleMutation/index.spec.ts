import { removeSavedArticle, saveArticleForLater } from '../../requests';
import type { WikipediaArticle } from '../../types';
import type { SavedArticle } from '../../../savedArticles/types';
import { useToggleSavedArticleMutation } from './index';

type Variables = { article: WikipediaArticle; saved: boolean };
type Context = { previousSavedArticles?: SavedArticle[] };
type Result = { saved: boolean; savedArticles: SavedArticle[] };
type Options = {
  mutationFn: (variables: Variables) => Promise<Result>;
  onMutate: (variables: Variables) => Promise<Context>;
  onError: (error: Error, variables: Variables, context?: Context) => void;
  onSuccess: (result: Result) => void;
};

let mockOptions: Options;
let mockCurrentUser: { id: string } | null;
const mockShowBanner = jest.fn();
const mockSetQueryData = jest.fn();
const mockCancelQueries = jest.fn();
const mockGetQueryData = jest.fn();

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ currentUser: mockCurrentUser }),
}));
jest.mock('@/components/banner', () => ({
  useBanner: () => ({ showBanner: mockShowBanner }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../requests', () => ({
  removeSavedArticle: jest.fn(),
  saveArticleForLater: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    setQueryData: mockSetQueryData,
    cancelQueries: mockCancelQueries,
    getQueryData: mockGetQueryData,
  }),
  useMutation: (options: Options) => {
    mockOptions = options;
    return {};
  },
}));

const article = {
  id: 42,
  title: 'Space',
  extract: '',
  url: 'https://example.test/42',
};
const previouslySaved = { ...article, savedAt: '2026-10-01T00:00:00.000Z' };

describe('useToggleSavedArticleMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-10-19T00:00:00.000Z'));
    mockCurrentUser = { id: 'user-42' };
    mockGetQueryData.mockReturnValue([]);
    jest.mocked(saveArticleForLater).mockResolvedValue([previouslySaved]);
    jest.mocked(removeSavedArticle).mockResolvedValue([]);
    useToggleSavedArticleMutation();
  });
  afterEach(() => jest.useRealTimers());

  it('saves the captured action even after its optimistic cache update', async () => {
    const variables = { article, saved: false };
    const context = await mockOptions.onMutate(variables);
    expect(context.previousSavedArticles).toEqual([]);
    expect(mockSetQueryData).toHaveBeenCalledWith(
      ['savedArticles', 'user-42'],
      [{ ...article, savedAt: '2026-10-19T00:00:00.000Z' }],
    );
    expect(await mockOptions.mutationFn(variables)).toEqual({
      saved: true,
      savedArticles: [previouslySaved],
    });
    expect(saveArticleForLater).toHaveBeenCalledWith('user-42', article);
    expect(removeSavedArticle).not.toHaveBeenCalled();
  });
  it('removes the requested article and can roll back the exact previous list', async () => {
    const previous = [previouslySaved];
    mockGetQueryData.mockReturnValue(previous);
    const variables = { article, saved: true };
    const context = await mockOptions.onMutate(variables);
    expect(mockSetQueryData).toHaveBeenLastCalledWith(
      ['savedArticles', 'user-42'],
      [],
    );
    await mockOptions.mutationFn(variables);
    expect(removeSavedArticle).toHaveBeenCalledWith('user-42', 42);
    mockOptions.onError(new Error('offline'), variables, context);
    expect(mockSetQueryData).toHaveBeenLastCalledWith(
      ['savedArticles', 'user-42'],
      previous,
    );
    expect(previous).toHaveLength(1);
  });
  it('does not write an optimistic cache or send a request without a user', async () => {
    mockCurrentUser = null;
    useToggleSavedArticleMutation();
    const variables = { article, saved: false };
    await mockOptions.onMutate(variables);
    await expect(mockOptions.mutationFn(variables)).rejects.toThrow(
      'auth.required',
    );
    expect(mockSetQueryData).not.toHaveBeenCalled();
    expect(saveArticleForLater).not.toHaveBeenCalled();
  });
  it('stores the confirmed list and shows the corresponding banner', () => {
    mockOptions.onSuccess({ saved: false, savedArticles: [] });
    expect(mockSetQueryData).toHaveBeenCalledWith(
      ['savedArticles', 'user-42'],
      [],
    );
    expect(mockShowBanner).toHaveBeenCalledWith({
      title: 'article.savedArticles.removed',
      variant: 'success',
    });
  });
});
