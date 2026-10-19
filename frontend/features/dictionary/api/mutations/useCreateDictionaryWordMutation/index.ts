import { useBanner } from '@/components/banner';
import { useAuth } from '@/features/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { createDictionaryWord } from '../../requests/createDictionaryWord';
import type { CreateDictionaryWordRequest } from '../../types';

export function useCreateDictionaryWordMutation() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateDictionaryWordRequest) =>
      createDictionaryWord(currentUser?.id ?? '', request),
    onError: (mutationError) => {
      const errorKey =
        mutationError instanceof Error
          ? mutationError.message
          : 'dictionary.saveError';

      showBanner({
        title: t(errorKey, { defaultValue: t('dictionary.saveError') }),
        variant: errorKey === 'dictionary.alreadyExists' ? 'info' : 'error',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['dictionary', 'words', currentUser?.id],
      });
      showBanner({
        title: t('dictionary.saved'),
        variant: 'success',
      });
    },
  });
}
