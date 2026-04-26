import { useMutation, useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { translateWord } from '@/api/translations';
import {
  type ArticleBlock,
  fetchWikipediaArticleDetail,
  type SimplifyArticleLevel,
  simplifyWikipediaArticle,
  type SimplifyArticleResponse,
  type SimplifyArticleTargetLength,
} from '@/api/wikipedia';
import { useBanner } from '@/components/banner';
import { Button } from '@/components/button';
import { OptionPickerField } from '@/components/optionPickerField';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { InteractiveArticleText } from './components/interactiveArticleText';
import { WordTranslationSheet } from './components/wordTranslationSheet';
import { styles } from './styles';

type SelectedWord = {
  context: string;
  tokenKey: string;
  word: string;
};

const DEFAULT_SIMPLIFICATION_LEVEL: SimplifyArticleLevel = 'A2';
const DEFAULT_TARGET_LENGTH: SimplifyArticleTargetLength = 'short';

export default function ArticleScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { showBanner } = useBanner();
  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [adaptedArticle, setAdaptedArticle] = useState<SimplifyArticleResponse | null>(null);
  const [showAdaptedText, setShowAdaptedText] = useState(false);
  const [hasImageLoadError, setHasImageLoadError] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<SimplifyArticleLevel>(
    DEFAULT_SIMPLIFICATION_LEVEL,
  );
  const [selectedTargetLength, setSelectedTargetLength] =
    useState<SimplifyArticleTargetLength>(DEFAULT_TARGET_LENGTH);

  const rawArticleId = Array.isArray(params.id) ? params.id[0] : params.id;
  const parsedArticleId = Number(rawArticleId);
  const articleId = Number.isFinite(parsedArticleId) ? parsedArticleId : null;

  const {
    data: article,
    error,
    isLoading,
    refetch,
  } = useQuery({
    enabled: articleId !== null,
    queryFn: async () => {
      if (articleId === null) {
        throw new Error('Invalid article id.');
      }

      return fetchWikipediaArticleDetail(articleId);
    },
    queryKey: ['wikipedia', 'article', articleId],
  });
  const {
    data: translation,
    error: translationError,
    isFetching: isTranslationLoading,
  } = useQuery({
    enabled: selectedWord !== null,
    queryFn: async () => {
      if (!selectedWord) {
        throw new Error('No word selected.');
      }

      return translateWord({
        context: selectedWord.context,
        sourceLanguage: 'en',
        targetLanguage: 'uk',
        word: selectedWord.word,
      });
    },
    queryKey: [
      'translation',
      selectedWord?.word ?? '',
      selectedWord?.context ?? '',
      'en',
      'uk',
    ],
  });
  const simplifyMutation = useMutation({
    mutationFn: async () => {
      if (!article) {
        throw new Error('Article is unavailable.');
      }

      return simplifyWikipediaArticle({
        level: selectedLevel,
        targetLength: selectedTargetLength,
        text: article.content,
        title: article.title,
      });
    },
    onError: (mutationError) => {
      const fallbackMessage = t('article.adaptError');
      const message =
        mutationError instanceof Error
          ? mutationError.message.replace(/^article\.adaptError:\s*/, '')
          : fallbackMessage;

      showBanner({
        title: message === 'article.adaptError' ? fallbackMessage : message,
        variant: 'error',
      });
    },
    onSuccess: (response) => {
      setAdaptedArticle(response);
      setShowAdaptedText(true);
      setSelectedWord(null);
    },
  });

  const levelOptions = useMemo(
    () => [
      { label: t('article.levels.A1'), value: 'A1' as const },
      { label: t('article.levels.A2'), value: 'A2' as const },
      { label: t('article.levels.B1'), value: 'B1' as const },
      { label: t('article.levels.B2'), value: 'B2' as const },
    ],
    [t],
  );

  const targetLengthOptions = useMemo(
    () => [
      { label: t('article.lengths.short'), value: 'short' as const },
      { label: t('article.lengths.medium'), value: 'medium' as const },
    ],
    [t],
  );

  const handleWordPress = useCallback((selection: SelectedWord) => {
    setSelectedWord(selection);
  }, []);

  const handleCloseTranslation = useCallback(() => {
    setSelectedWord(null);
  }, []);

  const handleAddToDictionary = useCallback(() => {
    showBanner({
      title: t('translation.dictionaryComingSoon'),
      variant: 'success',
    });
  }, [showBanner, t]);

  const handleAdaptPress = useCallback(() => {
    simplifyMutation.mutate();
  }, [simplifyMutation]);

  const handleShowOriginalPress = useCallback(() => {
    setSelectedWord(null);
    setShowAdaptedText(false);
  }, []);

  const handleShowAdaptedPress = useCallback(() => {
    setSelectedWord(null);
    setShowAdaptedText(true);
  }, []);

  const displayedText = useMemo(() => {
    if (showAdaptedText && adaptedArticle) {
      return adaptedArticle.adaptedText;
    }

    return article?.content ?? '';
  }, [adaptedArticle, article?.content, showAdaptedText]);
  const displayedBlocks = useMemo(() => {
    if (!article || showAdaptedText) {
      return undefined;
    }

    return stripDuplicateTitleHeading(article.blocks, article.title);
  }, [article, showAdaptedText]);

  useEffect(() => {
    setHasImageLoadError(false);
  }, [article?.thumbnailUrl]);

  if (articleId === null) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: t('article.titleFallback') }} />
        <View style={styles.centerState}>
          <ThemedText type="screenTitle" style={styles.centerTitle}>
            {t('article.errorTitle')}
          </ThemedText>
          <ThemedText type="description" style={styles.centerDescription}>
            {t('article.invalidId')}
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: t('article.titleFallback') }} />
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="large" />
          <ThemedText type="body">{t('article.loading')}</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !article) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: t('article.titleFallback') }} />
        <View style={styles.centerState}>
          <ThemedText type="screenTitle" style={styles.centerTitle}>
            {t('article.errorTitle')}
          </ThemedText>
          <ThemedText type="description" style={styles.centerDescription}>
            {t('article.errorDescription')}
          </ThemedText>
          <Button onPress={() => refetch()}>{t('article.retry')}</Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <Stack.Screen options={{ title: article.title }} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {article.thumbnailUrl && !hasImageLoadError ? (
          <Image
            contentFit="cover"
            onError={() => setHasImageLoadError(true)}
            source={{ uri: article.thumbnailUrl }}
            style={styles.heroImage}
          />
        ) : null}

        <View style={styles.header}>
          <ThemedText type="screenTitle">{article.title}</ThemedText>
          <Pressable onPress={() => Linking.openURL(article.url)}>
            <ThemedText type="bodyStrong" style={styles.wikipediaLink}>
              {t('article.openOriginal')}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          <OptionPickerField
            label={t('article.levelLabel')}
            onSelect={setSelectedLevel}
            options={levelOptions}
            selectedValue={selectedLevel}
            title={t('article.levelPickerTitle')}
          />
          <OptionPickerField
            label={t('article.lengthLabel')}
            onSelect={setSelectedTargetLength}
            options={targetLengthOptions}
            selectedValue={selectedTargetLength}
            title={t('article.lengthPickerTitle')}
          />
        </View>

        <View style={styles.actionRow}>
          <Button
            disabled={simplifyMutation.isPending}
            onPress={handleAdaptPress}
            variant="primary">
            {simplifyMutation.isPending
              ? t('article.adapting')
              : t('article.adaptText')}
          </Button>
          {adaptedArticle ? (
            <Button
              onPress={
                showAdaptedText ? handleShowOriginalPress : handleShowAdaptedPress
              }
              variant="secondary">
              {showAdaptedText
                ? t('article.showOriginalText')
                : t('article.showAdaptedText')}
            </Button>
          ) : null}
        </View>

        {adaptedArticle ? (
          <View style={styles.articleMeta}>
            <ThemedText type="description" style={styles.infoText}>
              {showAdaptedText
                ? t('article.adaptedState', {
                    adaptedLength: adaptedArticle.adaptedLength,
                    level: adaptedArticle.level,
                    originalLength: adaptedArticle.originalLength,
                    targetLength: t(`article.lengths.${adaptedArticle.targetLength}`),
                  })
                : t('article.originalState', {
                    level: adaptedArticle.level,
                    originalLength: adaptedArticle.originalLength,
                    targetLength: t(`article.lengths.${adaptedArticle.targetLength}`),
                  })}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.articleContent}>
          <InteractiveArticleText
            blocks={displayedBlocks}
            onWordPress={handleWordPress}
            selectedTokenKey={selectedWord?.tokenKey}
            text={displayedText}
          />
        </View>
      </ScrollView>
      <WordTranslationSheet
        context={selectedWord?.context}
        error={Boolean(translationError)}
        loading={isTranslationLoading}
        onAddToDictionary={handleAddToDictionary}
        onClose={handleCloseTranslation}
        open={selectedWord !== null}
        translation={translation?.translation}
        word={selectedWord?.word}
      />
    </ScreenContainer>
  );
}

function stripDuplicateTitleHeading(
  blocks: ArticleBlock[],
  articleTitle: string,
): ArticleBlock[] {
  const normalizedTitle = articleTitle.trim().toLowerCase();
  const firstBlock = blocks[0];

  if (
    firstBlock?.type === 'heading' &&
    firstBlock.level === 1 &&
    firstBlock.text.trim().toLowerCase() === normalizedTitle
  ) {
    return blocks.slice(1);
  }

  return blocks;
}
