import { useTranslation } from 'react-i18next';
import { useBanner } from '@/components/banner';
import { getDictionaryErrorMessageKey } from '../../utils/getDictionaryErrorMessageKey';

const ERROR_BANNER_DURATION_MS = 4200;
const DELETE_SUCCESS_BANNER_DURATION_MS = 3200;

/**
 * Provides dictionary banners for component-bound mutate callbacks.
 * @returns Save/delete success and shared error handlers; cancellation is silent.
 * @example
 * const { onSaved: showWordSavedBanner, onError: showDictionaryErrorBanner } = useDictionaryMutationFeedback();
 * save.mutate(word, { onSuccess: showWordSavedBanner, onError: showDictionaryErrorBanner });
 * // Feedback is skipped if the mutation's observer unmounts before completion.
 */
export function useDictionaryMutationFeedback() {
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  return {
    onSaved: () =>
      showBanner({ title: t('dictionary.saved'), variant: 'success' }),
    onDeleted: () =>
      showBanner({
        title: t('dictionary.deleted'),
        variant: 'success',
        durationMs: DELETE_SUCCESS_BANNER_DURATION_MS,
      }),
    onError: (error: unknown) => {
      const key = getDictionaryErrorMessageKey(error);
      if (!key) return;
      showBanner({
        title: t(key),
        variant: key === 'dictionary.alreadyExists' ? 'info' : 'error',
        durationMs: ERROR_BANNER_DURATION_MS,
      });
    },
  };
}
