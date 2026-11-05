import { useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type GestureResponderEvent } from 'react-native';

import { ThemedText } from '@/components/themedText';

import { createStyles as createCardStyles } from '../../styles';
import { createStyles } from './styles';

type ProgressMenuProps = {
  wordId: string;
  isUpdatingProgress: boolean;
  onMoveBackToInProgress: (wordId: string) => void;
};

export function ProgressMenu({
  wordId,
  isUpdatingProgress,
  onMoveBackToInProgress,
}: ProgressMenuProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const cardStyles = useMemo(
    () => createCardStyles(colors, 'in_progress'),
    [colors],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleMoveBackToInProgress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onMoveBackToInProgress(wordId);
  };

  return (
    <View style={[styles.progressMenu]}>
      <ThemedText style={[styles.progressMenuHint]}>
        {t('dictionary.progressMenuHint')}
      </ThemedText>
      <Pressable
        disabled={isUpdatingProgress}
        onPress={handleMoveBackToInProgress}
        style={[cardStyles.progressBadge, styles.progressMenuBadge]}
      >
        <ThemedText type="bodyStrong" style={[cardStyles.progressText]}>
          {t('dictionary.progress.in_progress')}
        </ThemedText>
      </Pressable>
    </View>
  );
}
