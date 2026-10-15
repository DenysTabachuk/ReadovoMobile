import { type ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';

import { styles } from './styles';

type QuizRunnerFooterProps = {
  action?: ReactNode;
  isDisabled: boolean;
  isLastQuestion: boolean;
  isSubmitted: boolean;
  onPrimaryPress: () => void;
};

export function QuizRunnerFooter({
  action,
  isDisabled,
  isLastQuestion,
  isSubmitted,
  onPrimaryPress,
}: QuizRunnerFooterProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.footer}>
      <Button
        disabled={isDisabled}
        onPress={onPrimaryPress}
        style={styles.footerButton}
      >
        {isSubmitted
          ? isLastQuestion
            ? t('dictionary.test.finish')
            : t('dictionary.test.next')
          : t('dictionary.test.check', { defaultValue: 'Check answer' })}
      </Button>
      {action}
    </View>
  );
}
