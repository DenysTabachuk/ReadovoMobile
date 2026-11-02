import {
  QueryClient,
  type MutationObserverOptions,
} from '@tanstack/react-query';
import { saveArticleForLater } from '../../requests';
import { useArticleMutationFeedback } from '../../../hooks/useArticleMutationFeedback';
import { useToggleSavedArticleMutation } from '.';

let mockClient: QueryClient;
let mockUnsubscribe = () => {};
const mockBanner = jest.fn();

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ currentUser: { id: 'reader-a' } }),
}));
jest.mock('../../requests', () => ({
  saveArticleForLater: jest.fn(),
  removeSavedArticle: jest.fn(),
}));
jest.mock('@/components/banner', () => ({
  useBanner: () => ({ showBanner: mockBanner }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
// Only the React binding is replaced. Real observers own callback ordering,
// per-call subscriptions, optimistic context, cache writes and promise settlement.
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  return {
    ...actual,
    useQueryClient: () => mockClient,
    useMutation: <TData, TError, TVariables, TContext>(
      options: MutationObserverOptions<TData, TError, TVariables, TContext>,
    ) => {
      const observer = new actual.MutationObserver(mockClient, options);
      mockUnsubscribe = observer.subscribe(() => undefined);
      return { mutateAsync: observer.mutate.bind(observer) };
    },
  };
});

const ARTICLE = {
  id: 42,
  title: 'Sun',
  extract: '',
  url: 'https://example.test/42',
};
const SAVED_ARTICLES = [{ ...ARTICLE, savedAt: '2026-10-30T10:00:00Z' }];
const FAILURE = new Error('Offline');

beforeEach(() => {
  jest.clearAllMocks();
  mockClient = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
  });
  mockClient.setQueryData(['savedArticles', 'reader-a'], []);
  jest.mocked(saveArticleForLater).mockResolvedValue(SAVED_ARTICLES);
});

afterEach(() => {
  mockUnsubscribe();
  mockClient.clear();
});

it('updates the owner cache and invokes mounted-screen success and settled callbacks', async () => {
  const { onSaved: showArticleSavedBanner } = useArticleMutationFeedback();
  const onSettled = jest.fn();
  await useToggleSavedArticleMutation().mutateAsync(
    { article: ARTICLE, saved: false },
    { onSuccess: showArticleSavedBanner, onSettled },
  );
  expect(mockClient.getQueryData(['savedArticles', 'reader-a'])).toEqual(
    SAVED_ARTICLES,
  );
  expect(mockBanner).toHaveBeenCalledWith({
    title: 'article.savedArticles.saved',
    variant: 'success',
  });
  expect(onSettled).toHaveBeenCalledTimes(1);
});

it('rolls back the current session and presents failure through per-call feedback', async () => {
  jest.mocked(saveArticleForLater).mockRejectedValueOnce(FAILURE);
  const { onError: showArticleErrorBanner } = useArticleMutationFeedback();
  await expect(
    useToggleSavedArticleMutation().mutateAsync(
      { article: ARTICLE, saved: false },
      { onError: showArticleErrorBanner },
    ),
  ).rejects.toBe(FAILURE);
  expect(mockClient.getQueryData(['savedArticles', 'reader-a'])).toEqual([]);
  expect(mockBanner).toHaveBeenCalledWith({
    title: 'errors.generic',
    variant: 'error',
  });
});

it.each(['success', 'failure'])(
  'keeps data %s handling after screen unmount while dropping UI callbacks',
  async (outcome) => {
    const requestStarted = Promise.withResolvers<void>();
    const releaseRequest = Promise.withResolvers<void>();
    jest.mocked(saveArticleForLater).mockImplementationOnce(async () => {
      requestStarted.resolve();
      await releaseRequest.promise;
      if (outcome === 'failure') throw FAILURE;
      return SAVED_ARTICLES;
    });
    const { onSaved: showArticleSavedBanner, onError: showArticleErrorBanner } =
      useArticleMutationFeedback();
    const pending = useToggleSavedArticleMutation().mutateAsync(
      { article: ARTICLE, saved: false },
      { onSuccess: showArticleSavedBanner, onError: showArticleErrorBanner },
    );
    await requestStarted.promise;
    mockUnsubscribe();
    releaseRequest.resolve();
    if (outcome === 'failure') await expect(pending).rejects.toBe(FAILURE);
    else
      await expect(pending).resolves.toMatchObject({
        savedArticles: SAVED_ARTICLES,
      });
    const expectedArticles = outcome === 'success' ? SAVED_ARTICLES : [];
    expect(mockClient.getQueryData(['savedArticles', 'reader-a'])).toEqual(
      expectedArticles,
    );
    expect(mockBanner).not.toHaveBeenCalled();
  },
);
