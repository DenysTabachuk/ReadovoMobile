import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { VocabularyLevel } from '@/api/generated/transport';
import { useTheme } from '@/hooks/use-theme';
import { LevelSelector } from '../../../../../../components/levelSelector';
import { styles } from './styles';

type LessonHeaderActionsProps = {
  title: string;
  level: VocabularyLevel;
  levels: VocabularyLevel[];
  onSelectLevel: (level: VocabularyLevel) => void;
  saved: boolean;
  bookmarkDisabled: boolean;
  onToggleSaved: () => void;
};

export function LessonHeaderActions({
  title,
  level,
  levels,
  onSelectLevel,
  saved,
  bookmarkDisabled,
  onToggleSaved,
}: LessonHeaderActionsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.actions}>
      <LevelSelector
        levels={levels}
        selected={level}
        onSelect={onSelectLevel}
      />
      <Pressable
        accessibilityRole="togglebutton"
        accessibilityState={{ checked: saved, disabled: bookmarkDisabled }}
        accessibilityLabel={t(
          saved
            ? 'learning.topics.removeBookmark'
            : 'learning.topics.saveLesson',
          { title },
        )}
        disabled={bookmarkDisabled}
        onPress={onToggleSaved}
        style={({ pressed }) => [
          styles.bookmark,
          (pressed || bookmarkDisabled) && styles.dimmed,
        ]}
      >
        <Ionicons
          accessible={false}
          name={saved ? 'bookmark' : 'bookmark-outline'}
          color={colors.interactive}
          size={24}
        />
      </Pressable>
    </View>
  );
}
