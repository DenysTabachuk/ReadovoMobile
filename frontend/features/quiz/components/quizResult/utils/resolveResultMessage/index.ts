import { type TFunction } from 'i18next';

import { type ResultMessage, type ResultTier } from '../../types';

export function resolveResultMessage(
  tier: ResultTier,
  t: TFunction,
): ResultMessage {
  if (tier === 'good') {
    return {
      subtitle: t('dictionary.test.resultGoodSubtitle', {
        defaultValue: 'You handled the test really well',
      }),
      title: t('dictionary.test.resultGoodTitle', {
        defaultValue: 'Great job!',
      }),
    };
  }

  if (tier === 'normal') {
    return {
      subtitle: t('dictionary.test.resultNormalSubtitle', {
        defaultValue:
          'Nice work, a bit more practice and you will do even better',
      }),
      title: t('dictionary.test.resultNormalTitle', {
        defaultValue: 'Good result',
      }),
    };
  }

  return {
    subtitle: t('dictionary.test.resultPoorSubtitle', {
      defaultValue: 'Try again to improve your result',
    }),
    title: t('dictionary.test.resultPoorTitle', {
      defaultValue: 'More practice needed',
    }),
  };
}
