import { ThemedText } from '@/components/themedText';
import type { ArticleBlock } from '@/features/articles/api';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { MetricComparison } from './components/metricComparison';
import { styles } from './styles';
import { compareArticleTextMetrics } from './utils/compareArticleTextMetrics';
type Props = {
  originalText: string;
  adaptedBlocks: ArticleBlock[];
};
export function ArticleMetrics({ originalText, adaptedBlocks }: Props) {
  const simplificationMetrics = useMemo(
    () => compareArticleTextMetrics(originalText, adaptedBlocks),
    [originalText, adaptedBlocks],
  );
  const { t } = useTranslation();
  const tintColor = useThemeColor({}, 'tint');
  const metricsBackgroundColor = useThemeColor(
    { dark: '#171c1d', light: '#f5f7fa' },
    'background',
  );
  const metricsBorderColor = useThemeColor(
    { dark: '#2d3336', light: '#d0d7de' },
    'text',
  );
  return (
    <View
      style={[
        styles.simplificationMetricsCard,
        {
          backgroundColor: metricsBackgroundColor,
          borderColor: metricsBorderColor,
        },
      ]}
    >
      <View style={styles.simplificationMetricsHeader}>
        <Ionicons color={tintColor} name="analytics-outline" size={18} />
        <ThemedText type="bodyStrong">
          {t('article.simplificationMetrics.title', {
            defaultValue: 'What changed',
          })}
        </ThemedText>
      </View>
      <View style={styles.simplificationMetricsGrid}>
        <MetricComparison
          adaptedValue={simplificationMetrics.adapted.wordCount}
          label={t('article.simplificationMetrics.words', {
            defaultValue: 'Words',
          })}
          originalValue={simplificationMetrics.original.wordCount}
        />
        <MetricComparison
          adaptedValue={simplificationMetrics.adapted.sentenceCount}
          label={t('article.simplificationMetrics.sentences', {
            defaultValue: 'Sentences',
          })}
          originalValue={simplificationMetrics.original.sentenceCount}
        />
        <MetricComparison
          adaptedValue={simplificationMetrics.adapted.averageSentenceWords}
          label={t('article.simplificationMetrics.averageSentence', {
            defaultValue: 'Avg. sentence',
          })}
          originalValue={simplificationMetrics.original.averageSentenceWords}
          suffix={t('article.simplificationMetrics.wordsSuffix', {
            defaultValue: 'w',
          })}
        />
        <MetricComparison
          adaptedValue={simplificationMetrics.adapted.averageWordLength}
          decimals={1}
          label={t('article.simplificationMetrics.averageWord', {
            defaultValue: 'Avg. word',
          })}
          originalValue={simplificationMetrics.original.averageWordLength}
          suffix={t('article.simplificationMetrics.charactersSuffix', {
            defaultValue: 'ch',
          })}
        />
      </View>
    </View>
  );
}
