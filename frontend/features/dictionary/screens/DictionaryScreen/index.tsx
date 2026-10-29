import type {
  DictionaryFilter,
  DictionaryProgressFilter,
  ProgressFilterOption,
} from './types';
import { ProgressFilterDropdown } from './components/progressFilterDropdown';
import { countWords } from './utils';
import { DictionaryWordCard } from './components/dictionaryWordCard';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
  type ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getDictionaryErrorMessageKey } from '../../utils/getDictionaryErrorMessageKey';
import { getApiErrorMessageKey } from '@/api/utils/getApiErrorMessageKey';

import {
  useDeleteDictionaryWordMutation,
  useDictionaryWordsQuery,
  useUpdateDictionaryWordProgressMutation,
  type DictionaryWord,
} from '../../api';
import { Button } from '@/components/button';
import { ModalSheet } from '@/components/modalSheet';
import { FloatingActionButton } from '@/components/floatingActionButton';
import { ScreenContainer } from '@/components/screenContainer';
import { SegmentedToggle } from '@/components/segmentedToggle';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import {
  PronunciationButton,
  TranslationCards,
  useWordTranslation,
} from '@/features/translations';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

export default function DictionaryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [openProgressMenuWordId, setOpenProgressMenuWordId] = useState<
    string | null
  >(null);
  const [deleteCandidate, setDeleteCandidate] = useState<DictionaryWord | null>(
    null,
  );
  const [isProgressFilterOpen, setIsProgressFilterOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<DictionaryWord | null>(null);
  const [activeFilter, setActiveFilter] = useState<DictionaryFilter>('all');
  const [activeProgressFilter, setActiveProgressFilter] =
    useState<DictionaryProgressFilter>('all');

  const { data, error, isFetching, isLoading, refetch } =
    useDictionaryWordsQuery();
  const words = useMemo(() => data ?? [], [data]);
  const filteredWords = useMemo(() => {
    return words.filter((word) => {
      if (
        activeProgressFilter !== 'all' &&
        word.progress !== activeProgressFilter
      ) {
        return false;
      }

      if (activeFilter === 'all') {
        return true;
      }

      const wordCount = countWords(word.word);
      return activeFilter === 'words' ? wordCount === 1 : wordCount > 1;
    });
  }, [activeFilter, activeProgressFilter, words]);
  const filterOptions = useMemo(
    () => [
      { label: t('dictionary.filter.all'), value: 'all' as const },
      { label: t('dictionary.filter.words'), value: 'words' as const },
      { label: t('dictionary.filter.phrases'), value: 'phrases' as const },
    ],
    [t],
  );
  const progressFilterOptions = useMemo<ProgressFilterOption[]>(
    () => [
      { label: t('dictionary.filter.all'), value: 'all' },
      { label: t('dictionary.progress.new'), value: 'new' },
      { label: t('dictionary.progress.in_progress'), value: 'in_progress' },
      { label: t('dictionary.progress.learned'), value: 'learned' },
    ],
    [t],
  );
  const {
    data: selectedWordTranslation,
    error: selectedWordTranslationError,
    isFetching: isSelectedWordTranslationLoading,
  } = useWordTranslation({
    context: selectedWord?.context,
    enabled: selectedWord !== null,
    queryScope: `dictionary-word-${selectedWord?.id ?? ''}`,
    word: selectedWord?.word,
  });
  const shouldShowInitialLoader = isLoading && words.length === 0;
  const errorMessageKey = error ? getDictionaryErrorMessageKey(error) : null;
  const translationErrorMessageKey = selectedWordTranslationError
    ? getApiErrorMessageKey(selectedWordTranslationError)
    : null;
  const shouldShowErrorState = Boolean(errorMessageKey) && words.length === 0;
  const { mutate: updateWordProgress, isPending: isUpdatingProgress } =
    useUpdateDictionaryWordProgressMutation({
      onSuccess: () => {
        setOpenProgressMenuWordId(null);
      },
    });
  const deleteWordMutation = useDeleteDictionaryWordMutation({
    onSuccess: () => {
      setDeleteCandidate(null);
      setSelectedWord(null);
    },
  });
  const handleToggleProgressMenu = useCallback((wordId: string) => {
    setOpenProgressMenuWordId((current) =>
      current === wordId ? null : wordId,
    );
  }, []);
  const handleMoveBackToInProgress = useCallback(
    (wordId: string) => {
      updateWordProgress({ progress: 'in_progress', wordId });
    },
    [updateWordProgress],
  );
  const renderWord = useCallback<ListRenderItem<DictionaryWord>>(
    ({ item }) => (
      <DictionaryWordCard
        word={item}
        isProgressMenuOpen={openProgressMenuWordId === item.id}
        isUpdatingProgress={isUpdatingProgress}
        onOpenWord={setSelectedWord}
        onToggleProgressMenu={handleToggleProgressMenu}
        onMoveBackToInProgress={handleMoveBackToInProgress}
      />
    ),
    [
      openProgressMenuWordId,
      isUpdatingProgress,
      handleToggleProgressMenu,
      handleMoveBackToInProgress,
    ],
  );

  const handleStartTest = useCallback(() => {
    router.push('/dictionary-test');
  }, [router]);
  const handleRequestDeleteWord = useCallback(() => {
    if (!selectedWord) {
      return;
    }

    setDeleteCandidate(selectedWord);
  }, [selectedWord]);
  const handleConfirmDeleteWord = useCallback(() => {
    if (!deleteCandidate) {
      return;
    }

    deleteWordMutation.mutate(deleteCandidate.id);
  }, [deleteCandidate, deleteWordMutation]);
  if (shouldShowInitialLoader) {
    return (
      <ScreenContainer>
        <View style={styles.centerState}>
          <ActivityIndicator
            color={Colors[colorScheme ?? 'light'].tint}
            size="large"
          />
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
            {t(errorMessageKey ?? 'dictionary.errorDescription')}
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
        data={filteredWords}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText type="sectionTitle" style={styles.centerTitle}>
              {words.length > 0
                ? t('dictionary.emptyFilteredTitle')
                : t('dictionary.emptyTitle')}
            </ThemedText>
            <ThemedText type="body" style={styles.centerDescription}>
              {words.length > 0
                ? t('dictionary.emptyFilteredDescription')
                : t('dictionary.emptyDescription')}
            </ThemedText>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="screenTitle">{t('dictionary.title')}</ThemedText>
            <ThemedText type="description" style={styles.description}>
              {t('dictionary.description')}
            </ThemedText>
            <SegmentedToggle
              onChange={setActiveFilter}
              options={filterOptions}
              selectedValue={activeFilter}
            />
            <ProgressFilterDropdown
              colorScheme={colorScheme}
              label={t('dictionary.progressFilterLabel')}
              onClose={() => setIsProgressFilterOpen(false)}
              onOpen={() => setIsProgressFilterOpen(true)}
              onSelect={setActiveProgressFilter}
              open={isProgressFilterOpen}
              options={progressFilterOptions}
              selectedValue={activeProgressFilter}
              title={t('dictionary.progressFilterTitle')}
            />
          </View>
        }
        ListFooterComponent={null}
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
      {filteredWords.length > 0 ? (
        <FloatingActionButton bottomOffset={8} onPress={handleStartTest}>
          {t('dictionary.test.start')}
        </FloatingActionButton>
      ) : null}
      <ModalSheet
        modalProps={{ presentationStyle: 'overFullScreen' }}
        onClose={() => setSelectedWord(null)}
        open={selectedWord !== null}
        showHandle
        title={selectedWord?.word ?? t('translation.titleFallback')}
      >
        <PronunciationButton word={selectedWord?.word} />
        {translationErrorMessageKey ? (
          <ThemedText type="body">{t(translationErrorMessageKey)}</ThemedText>
        ) : null}
        <TranslationCards
          baseTranslation={
            selectedWordTranslation?.baseTranslation ??
            selectedWord?.translation
          }
          context={selectedWord?.context}
          contextTranslation={selectedWordTranslation?.contextTranslation}
          contextualTranslation={selectedWordTranslation?.contextualTranslation}
          isContextLoading={isSelectedWordTranslationLoading}
          resetKey={selectedWord?.id}
          translation={
            selectedWordTranslation?.translation ?? selectedWord?.translation
          }
        />
        <View style={styles.wordModalActions}>
          <Button
            disabled={deleteWordMutation.isPending}
            onPress={handleRequestDeleteWord}
            variant="secondary"
          >
            {deleteWordMutation.isPending
              ? t('dictionary.deleteLoading')
              : t('dictionary.deleteAction')}
          </Button>
        </View>
      </ModalSheet>
      <ModalSheet
        footer={
          <View style={styles.confirmModalActions}>
            <Button
              disabled={deleteWordMutation.isPending}
              onPress={() => setDeleteCandidate(null)}
              style={styles.confirmModalButton}
              variant="secondary"
            >
              {t('dictionary.deleteCancel')}
            </Button>
            <Button
              disabled={deleteWordMutation.isPending}
              onPress={handleConfirmDeleteWord}
              style={styles.confirmModalButton}
            >
              {deleteWordMutation.isPending
                ? t('dictionary.deleteLoading')
                : t('dictionary.deleteConfirm')}
            </Button>
          </View>
        }
        onClose={() => setDeleteCandidate(null)}
        open={deleteCandidate !== null}
        title={t('dictionary.deleteTitle')}
      >
        <ThemedText type="body">
          {t('dictionary.deleteDescription', {
            word: deleteCandidate?.word ?? '',
          })}
        </ThemedText>
      </ModalSheet>
    </ScreenContainer>
  );
}
