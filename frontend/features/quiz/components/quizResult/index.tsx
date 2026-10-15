import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themedText';
import { Spacing } from '@/constants/spacing';

import { type QuizSessionResult } from '../../types';

import { ResultAnimation } from './components/resultAnimation';
import { ResultScore } from './components/resultScore';
import { styles } from './styles';
import { resolveResultMessage } from './utils/resolveResultMessage';
import { resolveResultTier } from './utils/resolveResultTier';

type QuizResultProps = {
  onDone: () => void;
  onRetry: () => void;
  result: QuizSessionResult;
  shouldShowTitle?: boolean;
  shouldUseSafeAreaBottom?: boolean;
  title: string;
};

export function QuizResult({
  onDone,
  onRetry,
  result,
  shouldShowTitle = true,
  shouldUseSafeAreaBottom = true,
  title,
}: QuizResultProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tier = resolveResultTier(result.percentage);
  const message = resolveResultMessage(tier, t);

  return (
    <View style={styles.container}>
      <ResultAnimation tier={tier} />

      <View style={styles.content}>
        {shouldShowTitle ? (
          <ThemedText type="screenTitle" style={styles.title}>
            {title}
          </ThemedText>
        ) : null}

        <ResultScore
          message={message}
          percentage={result.percentage}
          tier={tier}
        />
      </View>

      <View
        style={[
          styles.actions,
          {
            paddingBottom: shouldUseSafeAreaBottom
              ? Math.max(insets.bottom, Spacing.sm)
              : Spacing.sm,
          },
        ]}
      >
        <Button onPress={onDone} style={styles.actionButton}>
          {t('dictionary.test.done', { defaultValue: 'Done' })}
        </Button>
        <Button
          onPress={onRetry}
          style={styles.actionButton}
          variant="secondary"
        >
          {t('dictionary.test.retry', { defaultValue: 'Try the test again' })}
        </Button>
      </View>
    </View>
  );
}
