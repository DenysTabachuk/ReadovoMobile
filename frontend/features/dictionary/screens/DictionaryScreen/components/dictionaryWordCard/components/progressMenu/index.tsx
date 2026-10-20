import { useTranslation } from 'react-i18next';
import { Pressable, View, type GestureResponderEvent } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { getProgressBadgeColors } from '../../../../utils/getProgressBadgeColors';
import { styles as cardStyles } from '../../styles';
import { styles } from './styles';

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
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDarkTheme = colorScheme === 'dark';
  const inProgressColors = getProgressBadgeColors('in_progress', colorScheme);

  const handleMoveBackToInProgress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onMoveBackToInProgress(wordId);
  };

  return (
    <View style={[styles.progressMenu, isDarkTheme && styles.progressMenuDark]}>
      <ThemedText
        style={[
          styles.progressMenuHint,
          isDarkTheme && styles.progressMenuHintDark,
        ]}
      >
        {t('dictionary.progressMenuHint')}
      </ThemedText>
      <Pressable
        disabled={isUpdatingProgress}
        onPress={handleMoveBackToInProgress}
        style={[
          cardStyles.progressBadge,
          styles.progressMenuBadge,
          { backgroundColor: inProgressColors.backgroundColor },
        ]}
      >
        <ThemedText
          type="bodyStrong"
          style={[
            cardStyles.progressText,
            { color: inProgressColors.textColor },
          ]}
        >
          {t('dictionary.progress.in_progress')}
        </ThemedText>
      </Pressable>
    </View>
  );
}
