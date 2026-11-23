import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LearningLessonSummary } from '@/api/generated/transport';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { LearningArtwork } from '../../../../components/LearningArtwork';
import { createStyles } from './styles';

type LessonCardProps = {
  lesson: LearningLessonSummary;
  parentTitle: string;
  showParentTitle: boolean;
  saved: boolean;
  completed: boolean;
  bookmarkDisabled: boolean;
  onPress: () => void;
  onToggleSaved: () => void;
};

const THUMBNAIL_FALLBACK_ICON_SIZE = 32;

export function LessonCard({
  lesson,
  parentTitle,
  showParentTitle,
  saved,
  completed,
  bookmarkDisabled,
  onPress,
  onToggleSaved,
}: LessonCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={lesson.title}
        accessibilityHint={t(
          completed
            ? 'learning.topics.repeatLesson'
            : 'learning.topics.openLesson',
        )}
        onPress={onPress}
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
      >
        <LearningArtwork
          imageUrl={lesson.thumbnailUrl}
          style={styles.thumbnail}
          contentFit="cover"
          fallback={
            <View
              style={[styles.thumbnail, styles.thumbnailFallback]}
              accessible
              accessibilityLabel={t('image.unavailable')}
            >
              <Ionicons
                name="image-outline"
                size={THUMBNAIL_FALLBACK_ICON_SIZE}
                color={colors.textSecondary}
                accessible={false}
              />
            </View>
          }
        />
        <View style={styles.copy}>
          <ThemedText type="bodyStrong">{lesson.title}</ThemedText>
          {showParentTitle && (
            <ThemedText style={styles.detail}>{parentTitle}</ThemedText>
          )}
          <ThemedText numberOfLines={2} style={styles.detail}>
            {lesson.description}
          </ThemedText>
          {completed && (
            <ThemedText style={[styles.detail, styles.completed]}>
              {t('learning.topics.completedStatus')}
            </ThemedText>
          )}
        </View>
        <View style={styles.chevron} pointerEvents="none">
          <Ionicons
            name="chevron-forward"
            size={22}
            color={colors.textSecondary}
            accessible={false}
          />
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="togglebutton"
        accessibilityState={{
          checked: saved,
          disabled: bookmarkDisabled,
        }}
        accessibilityLabel={t(
          saved
            ? 'learning.topics.removeBookmark'
            : 'learning.topics.saveLesson',
          { title: lesson.title },
        )}
        disabled={bookmarkDisabled}
        onPress={onToggleSaved}
        style={styles.bookmark}
      >
        <Ionicons
          name={saved ? 'bookmark' : 'bookmark-outline'}
          size={22}
          color={colors.interactive}
          accessible={false}
        />
      </Pressable>
    </View>
  );
}
