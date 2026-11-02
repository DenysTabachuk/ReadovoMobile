import { useTranslation } from 'react-i18next';
import { useBanner } from '@/components/banner';
import { getArticleErrorMessageKey } from '../../utils/getArticleErrorMessageKey';

type SavedArticleResult = { saved: boolean };

/**
 * Provides article banners for component-bound mutate callbacks.
 * @returns Error feedback and saved-article success feedback; cancellation is silent.
 * @example
 * const { onSaved: showArticleSavedBanner, onError: showArticleErrorBanner } = useArticleMutationFeedback();
 * bookmark.mutate(action, { onSuccess: showArticleSavedBanner, onError: showArticleErrorBanner });
 * // A disposed screen does not display the outcome banner.
 */
export function useArticleMutationFeedback() {
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  return {
    onError: (error: unknown) => {
      const key = getArticleErrorMessageKey(error);
      if (key) showBanner({ title: t(key), variant: 'error' });
    },
    onSaved: ({ saved }: SavedArticleResult) =>
      showBanner({
        title: saved
          ? t('article.savedArticles.saved')
          : t('article.savedArticles.removed'),
        variant: 'success',
      }),
  };
}
