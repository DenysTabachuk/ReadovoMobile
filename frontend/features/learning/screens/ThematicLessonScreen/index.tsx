import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/button';
import { FullScreenLoader } from '@/components/fullScreenLoader';
import { ThemedText } from '@/components/themedText';
import { useLearningCatalogueQuery } from '../../api/queries/useLearningCatalogueQuery';
import { useLearningLevel } from '../../providers/learningLevelProvider';
import { LessonContent } from './components/lessonContent';

export default function ThematicLessonScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string | string[] }>();
  const { t } = useTranslation();
  const { data, isPending, refetch } = useLearningCatalogueQuery();
  const { selectedLevel } = useLearningLevel();
  if (typeof slug !== 'string' || !slug)
    return <ThemedText>{t('learning.topics.loadError')}</ThemedText>;
  if (isPending) return <FullScreenLoader />;
  if (!data)
    return <Button onPress={() => void refetch()}>{t('article.retry')}</Button>;
  const level = selectedLevel ?? data.defaultLevel;
  return <LessonContent key={`${slug}:${level}`} slug={slug} level={level} />;
}
