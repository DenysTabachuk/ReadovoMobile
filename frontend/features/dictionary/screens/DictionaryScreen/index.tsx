import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
  type DimensionValue,
  type GestureResponderEvent,
  type ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import {
  deleteDictionaryWord,
  fetchDictionaryWords,
  updateDictionaryWordProgress,
  type DictionaryWord,
  type DictionaryWordProgress,
} from '@/api/dictionary';
import { Button } from '@/components/button';
import { ModalSheet } from '@/components/modalSheet';
import { PronunciationButton } from '@/components/pronunciationButton';
import { useBanner } from '@/components/banner';
import { FloatingActionButton } from '@/components/floatingActionButton';
import { ScreenContainer } from '@/components/screenContainer';
import { SegmentedToggle } from '@/components/segmentedToggle';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { TranslationCards } from '@/features/translations/components/translationCards';
import { useWordTranslation } from '@/features/translations/hooks/useWordTranslation';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/providers/authProvider';

import { styles } from './styles';

type DictionaryFilter = 'all' | 'phrases' | 'words';
type DictionaryProgressFilter = 'all' | DictionaryWordProgress;
type ProgressFilterOption = {
  label: string;
  value: DictionaryProgressFilter;
};

export default function DictionaryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showBanner } = useBanner();
  const { currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const borderColor = colorScheme === 'dark' ? '#2d3336' : '#d0d7de';
  const [openProgressMenuWordId, setOpenProgressMenuWordId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<DictionaryWord | null>(null);
  const [isProgressFilterOpen, setIsProgressFilterOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<DictionaryWord | null>(null);
  const [activeFilter, setActiveFilter] = useState<DictionaryFilter>('all');
  const [activeProgressFilter, setActiveProgressFilter] =
    useState<DictionaryProgressFilter>('all');
  const userId = currentUser?.id;

  const {
    data,
    error,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    enabled: Boolean(userId),
    queryFn: () => fetchDictionaryWords(userId ?? ''),
    queryKey: ['dictionary', 'words', userId],
  });
  const words = data ?? [];
  const filteredWords = useMemo(() => {
    return words.filter((word) => {
      if (activeProgressFilter !== 'all' && word.progress !== activeProgressFilter) {
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
  const shouldShowErrorState = Boolean(error) && words.length === 0;
  const wordProgressMutation = useMutation({
    mutationFn: ({
      progress,
      wordId,
    }: {
      progress: DictionaryWordProgress;
      wordId: string;
    }) => updateDictionaryWordProgress(userId ?? '', wordId, { progress }),
    onError: () => {
      showBanner({
        description: t('dictionary.progressUpdateErrorDescription'),
        durationMs: 4200,
        title: t('dictionary.progressUpdateError'),
        variant: 'error',
      });
    },
    onSuccess: () => {
      setOpenProgressMenuWordId(null);
      void queryClient.invalidateQueries({ queryKey: ['dictionary', 'words', userId] });
      if (currentUser?.id) {
        void queryClient.invalidateQueries({
          queryKey: ['achievements-profile', currentUser.id],
        });
      }
    },
  });
  const deleteWordMutation = useMutation({
    mutationFn: (wordId: string) => deleteDictionaryWord(userId ?? '', wordId),
    onError: () => {
      showBanner({
        description: t('dictionary.deleteErrorDescription'),
        durationMs: 4200,
        title: t('dictionary.deleteError'),
        variant: 'error',
      });
    },
    onSuccess: () => {
      setDeleteCandidate(null);
      setSelectedWord(null);
      void queryClient.invalidateQueries({ queryKey: ['dictionary', 'words', userId] });
      showBanner({
        durationMs: 3200,
        title: t('dictionary.deleted'),
        variant: 'success',
      });
    },
  });
  const renderWord = useCallback<ListRenderItem<DictionaryWord>>(
    ({ item }) => {
      const progressColors = getProgressBadgeColors(item.progress, colorScheme);
      const progressRatio = Math.min(
        item.correctAnswersCount / item.requiredCorrectAnswers,
        1,
      );
      const progressPercentage: DimensionValue = `${Math.round(progressRatio * 100)}%`;
      const isProgressMenuOpen = openProgressMenuWordId === item.id;
      const inProgressColors = getProgressBadgeColors('in_progress', colorScheme);
      const isDarkTheme = colorScheme === 'dark';

      const handleProgressPress = (event: GestureResponderEvent) => {
        event.stopPropagation();
        setOpenProgressMenuWordId((current) =>
          current === item.id ? null : item.id,
        );
      };

      const handleMoveBackToInProgress = (event: GestureResponderEvent) => {
        event.stopPropagation();
        wordProgressMutation.mutate({
          progress: 'in_progress',
          wordId: item.id,
        });
      };

      return (
        <Pressable
          accessibilityRole="button"
          onPress={() => setSelectedWord(item)}
          style={[styles.wordCard, { borderColor }]}>
          <View style={styles.cardHeader}>
            <View style={styles.wordTitleGroup}>
              <ThemedText type="sectionTitle" style={styles.wordText}>
                {item.word}
              </ThemedText>
              <ThemedText type="body" style={styles.wordPreviewText}>
                {item.translation}
              </ThemedText>
            </View>
            <View style={styles.progressControl}>
              <Pressable
                disabled={item.progress !== 'learned'}
                onPress={handleProgressPress}
                style={[
                  styles.progressBadge,
                  { backgroundColor: progressColors.backgroundColor },
                ]}>
                <ThemedText
                  type="bodyStrong"
                  style={[styles.progressText, { color: progressColors.textColor }]}>
                  {getProgressLabel(item.progress, t)}
                </ThemedText>
              </Pressable>
              {isProgressMenuOpen ? (
                <View
                  style={[
                    styles.progressMenu,
                    isDarkTheme && styles.progressMenuDark,
                  ]}>
                  <ThemedText
                    style={[
                      styles.progressMenuHint,
                      isDarkTheme && styles.progressMenuHintDark,
                    ]}>
                    {t('dictionary.progressMenuHint')}
                  </ThemedText>
                  <Pressable
                    disabled={wordProgressMutation.isPending}
                    onPress={handleMoveBackToInProgress}
                    style={[
                      styles.progressBadge,
                      styles.progressMenuBadge,
                      { backgroundColor: inProgressColors.backgroundColor },
                    ]}>
                    <ThemedText
                      type="bodyStrong"
                      style={[
                        styles.progressText,
                        { color: inProgressColors.textColor },
                      ]}>
                      {t('dictionary.progress.in_progress')}
                    </ThemedText>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.learningProgressBlock}>
            <View style={styles.learningProgressTrack}>
              <View
                style={[
                  styles.learningProgressFill,
                  { width: progressPercentage },
                ]}
              />
            </View>
            <ThemedText style={styles.learningProgressText}>
              {`${Math.min(item.correctAnswersCount, item.requiredCorrectAnswers)}/${item.requiredCorrectAnswers}`}
            </ThemedText>
          </View>
          <View style={styles.cardTapHint}>
            <Ionicons
              color={Colors[colorScheme ?? 'light'].icon}
              name="open-outline"
              size={13}
            />
            <ThemedText type="description" style={styles.cardTapHintText}>
              {t('dictionary.tapHint')}
            </ThemedText>
          </View>
        </Pressable>
      );
    },
    [
      borderColor,
      colorScheme,
      openProgressMenuWordId,
      t,
      wordProgressMutation,
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
        <FloatingActionButton
          bottomOffset={8}
          onPress={handleStartTest}>
          {t('dictionary.test.start')}
        </FloatingActionButton>
      ) : null}
      <ModalSheet
        modalProps={{ presentationStyle: 'overFullScreen' }}
        onClose={() => setSelectedWord(null)}
        open={selectedWord !== null}
        showHandle
        title={selectedWord?.word ?? t('translation.titleFallback')}>
        <PronunciationButton word={selectedWord?.word} />
        {selectedWordTranslationError ? (
          <ThemedText type="body">{t('translation.error')}</ThemedText>
        ) : null}
        <TranslationCards
          baseTranslation={
            selectedWordTranslation?.baseTranslation ?? selectedWord?.translation
          }
          context={selectedWord?.context}
          contextTranslation={selectedWordTranslation?.contextTranslation}
          contextualTranslation={selectedWordTranslation?.contextualTranslation}
          isContextLoading={isSelectedWordTranslationLoading}
          resetKey={selectedWord?.id}
          translation={selectedWordTranslation?.translation ?? selectedWord?.translation}
        />
        <View style={styles.wordModalActions}>
          <Button
            disabled={deleteWordMutation.isPending}
            onPress={handleRequestDeleteWord}
            variant="secondary">
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
              variant="secondary">
              {t('dictionary.deleteCancel')}
            </Button>
            <Button
              disabled={deleteWordMutation.isPending}
              onPress={handleConfirmDeleteWord}
              style={styles.confirmModalButton}>
              {deleteWordMutation.isPending
                ? t('dictionary.deleteLoading')
                : t('dictionary.deleteConfirm')}
            </Button>
          </View>
        }
        onClose={() => setDeleteCandidate(null)}
        open={deleteCandidate !== null}
        title={t('dictionary.deleteTitle')}>
        <ThemedText type="body">
          {t('dictionary.deleteDescription', {
            word: deleteCandidate?.word ?? '',
          })}
        </ThemedText>
      </ModalSheet>
    </ScreenContainer>
  );
}

type ProgressFilterDropdownProps = {
  colorScheme: ReturnType<typeof useColorScheme>;
  label: string;
  onClose: () => void;
  onOpen: () => void;
  onSelect: (value: DictionaryProgressFilter) => void;
  open: boolean;
  options: ProgressFilterOption[];
  selectedValue: DictionaryProgressFilter;
  title: string;
};

function ProgressFilterDropdown({
  colorScheme,
  label,
  onClose,
  onOpen,
  onSelect,
  open,
  options,
  selectedValue,
  title,
}: ProgressFilterDropdownProps) {
  const selectedOption = options.find((option) => option.value === selectedValue);
  const borderColor = useThemeColor({ dark: '#3a4348', light: '#d0d7de' }, 'icon');
  const buttonBackgroundColor = useThemeColor(
    { dark: '#202425', light: '#f5f7fa' },
    'background',
  );
  const optionBackgroundColor = useThemeColor(
    { dark: '#151718', light: '#ffffff' },
    'background',
  );
  const selectedBackgroundColor = useThemeColor(
    { dark: '#123847', light: '#e8f5f9' },
    'background',
  );
  const selectedBorderColor = useThemeColor(
    { dark: '#67c6e3', light: '#0a7ea4' },
    'tint',
  );
  const chevronColor = useThemeColor({ dark: '#9ba1a6', light: '#687076' }, 'icon');

  const handleSelect = useCallback(
    (value: DictionaryProgressFilter) => {
      onSelect(value);
      onClose();
    },
    [onClose, onSelect],
  );

  return (
    <>
      <View style={styles.progressFilterField}>
        <ThemedText type="bodyStrong">{label}</ThemedText>
        <Pressable
          onPress={onOpen}
          style={[
            styles.progressFilterButton,
            { backgroundColor: buttonBackgroundColor, borderColor },
          ]}>
          {selectedValue === 'all' ? (
            <ThemedText style={styles.progressFilterAllText} type="bodyStrong">
              {selectedOption?.label ?? selectedValue}
            </ThemedText>
          ) : (
            <ProgressStatusBadge
              colorScheme={colorScheme}
              label={selectedOption?.label ?? selectedValue}
              progress={selectedValue}
            />
          )}
          <Ionicons color={chevronColor} name="chevron-down" size={18} />
        </Pressable>
      </View>

      <ModalSheet onClose={onClose} open={open} title={title}>
        <View style={styles.progressFilterOptions}>
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                style={[
                  styles.progressFilterOption,
                  { backgroundColor: optionBackgroundColor, borderColor },
                  isSelected
                    ? {
                        backgroundColor: selectedBackgroundColor,
                        borderColor: selectedBorderColor,
                      }
                    : null,
                ]}>
                {option.value === 'all' ? (
                  <ThemedText style={styles.progressFilterAllText} type="bodyStrong">
                    {option.label}
                  </ThemedText>
                ) : (
                  <ProgressStatusBadge
                    colorScheme={colorScheme}
                    label={option.label}
                    progress={option.value}
                  />
                )}
                {isSelected ? (
                  <Ionicons color={selectedBorderColor} name="checkmark-circle" size={20} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ModalSheet>
    </>
  );
}

type ProgressStatusBadgeProps = {
  colorScheme: ReturnType<typeof useColorScheme>;
  label: string;
  progress: DictionaryWordProgress;
};

function ProgressStatusBadge({
  colorScheme,
  label,
  progress,
}: ProgressStatusBadgeProps) {
  const progressColors = getProgressBadgeColors(progress, colorScheme);

  return (
    <View
      style={[
        styles.progressBadge,
        styles.progressFilterBadge,
        { backgroundColor: progressColors.backgroundColor },
      ]}>
      <ThemedText
        type="bodyStrong"
        style={[styles.progressText, { color: progressColors.textColor }]}>
        {label}
      </ThemedText>
    </View>
  );
}

function getProgressLabel(
  progress: DictionaryWordProgress,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  return t(`dictionary.progress.${progress}`);
}

function getProgressBadgeColors(
  progress: DictionaryWordProgress,
  colorScheme: ReturnType<typeof useColorScheme>,
): { backgroundColor: string; textColor: string } {
  const isDark = colorScheme === 'dark';

  if (progress === 'learned') {
    return {
      backgroundColor: isDark ? '#173522' : '#dff7e8',
      textColor: isDark ? '#7ee0a0' : '#1f8a4c',
    };
  }

  if (progress === 'in_progress') {
    return {
      backgroundColor: isDark ? '#3a2d14' : '#fff2cc',
      textColor: isDark ? '#ffd36a' : '#9a6700',
    };
  }

  return {
    backgroundColor: isDark ? '#263238' : '#e6f4f8',
    textColor: isDark ? '#7ccce6' : '#0a7ea4',
  };
}

function countWords(value: string): number {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
