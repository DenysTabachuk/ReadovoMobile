import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { LearningEntry } from '@/api/generated/transport';
import { ImageWithFallback } from '@/components/imageWithFallback';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { LESSON_THUMBNAILS } from '../../../../assets/lesson-art';
import {
  DEFAULT_TOPIC_COVER,
  TOPIC_COVERS,
} from '../../../../assets/topic-covers';
import { createStyles } from './styles';

type LessonCardDetails = {
  parentTitle?: string;
  saved: boolean;
  completed: boolean;
  bookmarkDisabled: boolean;
  onToggleSaved: () => void;
};

type CatalogueCardProps = {
  entry: LearningEntry;
  onPress: () => void;
  lesson?: LessonCardDetails;
};

export function CatalogueCard({ entry, onPress, lesson }: CatalogueCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  let cover = DEFAULT_TOPIC_COVER;
  if (entry.coverImageKey !== null)
    cover = TOPIC_COVERS.get(entry.coverImageKey) ?? DEFAULT_TOPIC_COVER;
  if (lesson) {
    return (
      <View style={[styles.card, styles.lesson]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={entry.title}
          accessibilityHint={t(
            lesson.completed
              ? 'learning.topics.repeatLesson'
              : 'learning.topics.openLesson',
          )}
          onPress={onPress}
          style={({ pressed }) => [
            styles.lessonLink,
            pressed && styles.pressed,
          ]}
        >
          <ImageWithFallback
            source={LESSON_THUMBNAILS.get(entry.slug) ?? cover}
            style={styles.thumbnail}
            contentFit="cover"
            accessible={false}
          />
          <View style={styles.lessonCopy}>
            <ThemedText type="bodyStrong">{entry.title}</ThemedText>
            {lesson.parentTitle && (
              <ThemedText style={styles.lessonDetail}>
                {lesson.parentTitle}
              </ThemedText>
            )}
            <ThemedText numberOfLines={2} style={styles.lessonDetail}>
              {entry.description}
            </ThemedText>
            {lesson.completed && (
              <ThemedText style={[styles.lessonDetail, styles.completed]}>
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
            checked: lesson.saved,
            disabled: lesson.bookmarkDisabled,
          }}
          accessibilityLabel={t(
            lesson.saved
              ? 'learning.topics.removeBookmark'
              : 'learning.topics.saveLesson',
            { title: entry.title },
          )}
          disabled={lesson.bookmarkDisabled}
          onPress={lesson.onToggleSaved}
          style={styles.bookmark}
        >
          <Ionicons
            name={lesson.saved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={colors.interactive}
            accessible={false}
          />
        </Pressable>
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={entry.title}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ImageWithFallback
        source={cover}
        style={styles.cover}
        contentFit="cover"
        accessible={false}
        fallback={
          <Image
            source={DEFAULT_TOPIC_COVER}
            style={styles.cover}
            contentFit="cover"
            accessible={false}
          />
        }
      />
      <View style={styles.footer}>
        <View style={styles.copy}>
          <ThemedText type="sectionTitle">{entry.title}</ThemedText>
          <ThemedText style={styles.secondary}>{entry.description}</ThemedText>
        </View>
        <Ionicons
          name="arrow-forward-outline"
          size={28}
          color={colors.interactive}
          accessible={false}
        />
      </View>
    </Pressable>
  );
}
