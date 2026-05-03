import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
  type ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  fetchDictionaryWords,
  type DictionaryWord,
  type DictionaryWordProgress,
} from '@/api/dictionary';
import { Button } from '@/components/button';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

export default function DictionaryScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const borderColor = colorScheme === 'dark' ? '#2d3336' : '#d0d7de';
  const badgeBackgroundColor = colorScheme === 'dark' ? '#263238' : '#e6f4f8';

  const {
    data,
    error,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryFn: fetchDictionaryWords,
    queryKey: ['dictionary', 'words'],
  });
  const words = data ?? [];
  const shouldShowInitialLoader = isLoading && words.length === 0;
  const shouldShowErrorState = Boolean(error) && words.length === 0;

  const renderWord = useCallback<ListRenderItem<DictionaryWord>>(
    ({ item }) => (
      <View style={[styles.wordCard, { borderColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.wordTitleGroup}>
            <ThemedText type="sectionTitle" style={styles.wordText}>
              {item.word}
            </ThemedText>
            <ThemedText type="bodyStrong" style={styles.translationText}>
              {item.translation}
            </ThemedText>
          </View>
          <View style={[styles.progressBadge, { backgroundColor: badgeBackgroundColor }]}>
            <ThemedText type="bodyStrong" style={styles.progressText}>
              {getProgressLabel(item.progress, t)}
            </ThemedText>
          </View>
        </View>

        <ThemedText type="body" style={styles.contextText}>
          {item.context}
        </ThemedText>
      </View>
    ),
    [badgeBackgroundColor, borderColor, t],
  );

  if (shouldShowInitialLoader) {
    return (
      <ScreenContainer>
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="large" />
          <ThemedText type="body">{t('dictionary.loading')}</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (shouldShowErrorState) {
    return (
      <ScreenContainer>
        <View style={styles.centerState}>
          <ThemedText type="screenTitle" style={styles.centerTitle}>
            {t('dictionary.errorTitle')}
          </ThemedText>
          <ThemedText type="description" style={styles.centerDescription}>
            {t('dictionary.errorDescription')}
          </ThemedText>
          <Button onPress={() => refetch()}>{t('dictionary.retry')}</Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={words}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText type="sectionTitle" style={styles.centerTitle}>
              {t('dictionary.emptyTitle')}
            </ThemedText>
            <ThemedText type="body" style={styles.centerDescription}>
              {t('dictionary.emptyDescription')}
            </ThemedText>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="screenTitle">{t('dictionary.title')}</ThemedText>
            <ThemedText type="description" style={styles.description}>
              {t('dictionary.description')}
            </ThemedText>
          </View>
        }
        refreshControl={
          <RefreshControl
            onRefresh={refetch}
            refreshing={isFetching && !isLoading}
            tintColor={Colors[colorScheme ?? 'light'].tint}
          />
        }
        renderItem={renderWord}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

function getProgressLabel(
  progress: DictionaryWordProgress,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  return t(`dictionary.progress.${progress}`);
}
