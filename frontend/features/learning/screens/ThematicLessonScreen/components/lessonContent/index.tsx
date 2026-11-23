import { useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { VocabularyLevel } from '@/api/generated/transport';
import { Button } from '@/components/button';
import { FullScreenLoader } from '@/components/fullScreenLoader';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import {
  PracticeSession,
  usePrefetchPracticeArtwork,
  WordCards,
} from '@/features/vocabulary';
import { useTheme } from '@/hooks/use-theme';
import { useLearningLessonQuery } from '../../../../api/queries/useLearningLessonQuery';
import { useLessonLibrary } from '../../../../hooks/useLessonLibrary';
import { useLearningLevel } from '../../../../providers/learningLevelProvider';
import { LessonReadingActivity } from '../LessonReadingActivity';
import { ReadingQuiz } from '../ReadingQuiz';
import { createStyles } from './styles';
import { LessonPath } from './components/lessonPath';
import { LessonOverviewHeader } from './components/LessonOverviewHeader';
import { LessonHeaderActions } from './components/lessonHeaderActions';

type LessonProps = { slug: string; level: VocabularyLevel };
type LessonActivity =
  | { kind: 'words' }
  | { kind: 'practice' }
  | { kind: 'reading' }
  | { kind: 'comprehension' };

const HIDE_HEADER_ACTIONS = { headerRight: () => null };

export function LessonContent({ slug, level }: LessonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { selectLevel } = useLearningLevel();
  const { data, isPending, refetch } = useLearningLessonQuery(slug, level);
  const { query: library, mutation: updateLibrary } = useLessonLibrary();
  const [activity, setActivity] = useState<LessonActivity | null>(null);
  const variant = data?.variant;
  usePrefetchPracticeArtwork(
    variant?.vocabulary.questions ?? [],
    activity === null ? 'preview' : 'inactive',
  );
  // Activities share the lesson route: Back closes the activity before leaving the lesson.
  usePreventRemove(activity !== null, () => setActivity(null));
  if (isPending)
    return (
      <>
        <Stack.Screen options={HIDE_HEADER_ACTIONS} />
        <FullScreenLoader />
      </>
    );
  if (!data)
    return (
      <ScrollableScreen>
        <Stack.Screen options={HIDE_HEADER_ACTIONS} />
        <ThemedText>{t('learning.topics.loadError')}</ThemedText>
        <Button onPress={() => void refetch()}>{t('article.retry')}</Button>
      </ScrollableScreen>
    );
  const saved =
    library.data?.some((entry) => entry.slug === slug && entry.saved) ?? false;
  const completeLesson = () =>
    updateLibrary.mutate({
      slug,
      topic: data.topicSlug,
      flag: 'completed',
      value: true,
    });
  const close = () => setActivity(null);
  if (variant && activity) {
    let content;
    if (activity.kind === 'words') {
      content = (
        <WordCards
          title={data.title}
          words={variant.vocabulary.words}
          onContinue={close}
        />
      );
    } else if (activity.kind === 'practice') {
      content = (
        <PracticeSession
          lessonSlug={slug}
          level={level}
          title={data.title}
          questions={variant.vocabulary.questions}
          onBackToLesson={close}
          onContinue={() => setActivity({ kind: 'reading' })}
        />
      );
    } else if (activity.kind === 'reading') {
      content = (
        <LessonReadingActivity
          variant={variant}
          readingImageUrl={data.readingImageUrl}
          readingCheckImageUrl={data.readingCheckImageUrl}
          onContinue={() => setActivity({ kind: 'comprehension' })}
        />
      );
    } else {
      content = (
        <ReadingQuiz
          slug={slug}
          resultsImageUrl={data.resultsImageUrl}
          level={level}
          questions={variant.questions}
          onBack={close}
          onComplete={completeLesson}
          completionPending={updateLibrary.isPending}
          completionError={updateLibrary.isError}
        />
      );
    }
    return (
      <View style={styles.activity}>
        <Stack.Screen options={HIDE_HEADER_ACTIONS} />
        {content}
      </View>
    );
  }
  const hasWords = Boolean(variant?.vocabulary.words.length);
  const hasPractice = Boolean(variant?.vocabulary.questions.length);
  return (
    <ScrollableScreen contentContainerStyle={styles.content} edges={[]}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <LessonHeaderActions
              title={data.title}
              level={level}
              levels={data.supportedLevels}
              onSelectLevel={selectLevel}
              saved={saved}
              bookmarkDisabled={!library.data || updateLibrary.isPending}
              onToggleSaved={() =>
                updateLibrary.mutate({
                  slug,
                  topic: data.topicSlug,
                  flag: 'saved',
                  value: !saved,
                })
              }
            />
          ),
        }}
      />
      <LessonOverviewHeader
        title={data.title}
        description={data.description}
        topicSlug={data.topicSlug}
        coverImageUrl={data.coverImageUrl}
      />
      {library.isError && (
        <Button onPress={() => void library.refetch()}>
          {t('learning.topics.libraryLoadError')}
        </Button>
      )}
      {updateLibrary.isError && (
        <ThemedText accessibilityRole="alert">
          {t('learning.topics.libraryWriteError')}
        </ThemedText>
      )}
      {variant && (
        <ThemedText style={styles.secondary}>
          {t('learning.lesson.summary', {
            words: variant.vocabulary.words.length,
            questions: variant.questions.length,
          })}
        </ThemedText>
      )}
      {variant ? (
        <>
          <LessonPath
            steps={[
              {
                id: 'words',
                title: t('learning.lesson.words', {
                  count: variant.vocabulary.words.length,
                }),
                description: t('learning.lesson.wordsDescription', {
                  count: variant.vocabulary.words.length,
                }),
                icon: 'albums-outline',
                available: hasWords,
                onPress: () => {
                  if (hasWords) setActivity({ kind: 'words' });
                },
              },
              {
                id: 'practice',
                title: t('learning.lesson.wordTest'),
                description: t('learning.lesson.practiceDescription'),
                icon: 'extension-puzzle-outline',
                available: hasPractice,
                onPress: () => {
                  if (hasPractice) setActivity({ kind: 'practice' });
                },
              },
              {
                id: 'reading',
                title: t('learning.lesson.reading'),
                description: variant.readingTitle,
                icon: 'book-outline',
                available: true,
                onPress: () => setActivity({ kind: 'reading' }),
              },
              {
                id: 'comprehension',
                title: t('learning.lesson.comprehension'),
                description: t('learning.lesson.comprehensionDescription'),
                icon: 'chatbubbles-outline',
                available: true,
                onPress: () => setActivity({ kind: 'comprehension' }),
              },
            ]}
          />
          <Button
            disabled={!hasWords}
            onPress={() => {
              if (hasWords) setActivity({ kind: 'words' });
            }}
          >
            {t('vocabulary.startLesson')}
          </Button>
          <ThemedText style={styles.secondary}>
            {t('learning.topics.completionHint')}
          </ThemedText>
        </>
      ) : (
        <ThemedText>
          {t('learning.topics.levelUnavailable', { level })}
        </ThemedText>
      )}
    </ScrollableScreen>
  );
}
