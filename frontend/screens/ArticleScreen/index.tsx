import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { translateWord } from '@/api/translations';
import { createDictionaryWord } from '@/api/dictionary';
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
import { Cta } from '@/components/cta';
import { ModalSheet } from '@/components/modalSheet';
import { OptionPickerField } from '@/components/optionPickerField';
import { ScreenContainer } from '@/components/screenContainer';
import { SegmentedToggle } from '@/components/segmentedToggle';
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
type ArticleTextLengthOption = SimplifyArticleTargetLength | 'original';

const DEFAULT_SIMPLIFICATION_LEVEL: SimplifyArticleLevel = 'A2';
const DEFAULT_TARGET_LENGTH: ArticleTextLengthOption = 'short';
const TARGET_LENGTH_MAX_SENTENCES: Record<SimplifyArticleTargetLength, number> = {
  short: 5,
  medium: 10,
  long: 16,
};

export default function ArticleScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
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
    useState<ArticleTextLengthOption>(DEFAULT_TARGET_LENGTH);
  const [isAdaptSettingsOpen, setIsAdaptSettingsOpen] = useState(false);

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

      const targetLength =
        selectedTargetLength === 'original' ? undefined : selectedTargetLength;

      return simplifyWikipediaArticle({
        level: selectedLevel,
        targetLength,
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
  const dictionaryMutation = useMutation({
    mutationFn: createDictionaryWord,
    onError: () => {
      showBanner({
        title: t('dictionary.saveError'),
        variant: 'error',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dictionary', 'words'] });
      showBanner({
        title: t('dictionary.saved'),
        variant: 'success',
      });
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
    () => {
      const sentenceCount = countSentences(article?.content ?? '');

      return [
        {
          disabled: false,
          displayLabel: t('article.lengthsShort.original'),
          label: t('article.lengths.original'),
          value: 'original' as const,
        },
        {
          disabled: sentenceCount <= TARGET_LENGTH_MAX_SENTENCES.short,
          displayLabel: t('article.lengthsShort.short'),
          label: t('article.lengths.short'),
          value: 'short' as const,
        },
        {
          disabled: sentenceCount <= TARGET_LENGTH_MAX_SENTENCES.medium,
          displayLabel: t('article.lengthsShort.medium'),
          label: t('article.lengths.medium'),
          value: 'medium' as const,
        },
        {
          disabled: sentenceCount <= TARGET_LENGTH_MAX_SENTENCES.long,
          displayLabel: t('article.lengthsShort.long'),
          label: t('article.lengths.long'),
          value: 'long' as const,
        },
      ];
    },
    [article?.content, t],
  );

  const isSelectedTargetLengthDisabled = Boolean(
    targetLengthOptions.find((option) => option.value === selectedTargetLength)?.disabled,
  );

  const handleWordPress = useCallback((selection: SelectedWord) => {
    setSelectedWord(selection);
  }, []);

  const handleCloseTranslation = useCallback(() => {
    setSelectedWord(null);
  }, []);

  const handleAddToDictionary = useCallback(() => {
    if (!selectedWord || !translation?.translation) {
      return;
    }

    dictionaryMutation.mutate({
      context: selectedWord.context,
      translation: translation.translation,
      word: selectedWord.word,
    });
  }, [dictionaryMutation, selectedWord, translation?.translation]);

  const handleOpenAdaptSettings = useCallback(() => {
    setIsAdaptSettingsOpen(true);
  }, []);

  const handleCloseAdaptSettings = useCallback(() => {
    setIsAdaptSettingsOpen(false);
  }, []);

  const handleAdaptFromModal = useCallback(() => {
    simplifyMutation.mutate();
    setIsAdaptSettingsOpen(false);
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
  const shouldRenderHeroImage = useMemo(() => {
    if (!article?.thumbnailUrl || hasImageLoadError) {
      return false;
    }

    if (showAdaptedText) {
      return true;
    }

    return !hasDuplicateArticleImage(article.thumbnailUrl, displayedBlocks ?? article.blocks);
  }, [
    article?.blocks,
    article?.thumbnailUrl,
    displayedBlocks,
    hasImageLoadError,
    showAdaptedText,
  ]);

  useEffect(() => {
    setHasImageLoadError(false);
  }, [article?.thumbnailUrl]);

  useEffect(() => {
    if (!isSelectedTargetLengthDisabled) {
      return;
    }

    const firstEnabledOption = targetLengthOptions.find((option) => !option.disabled);

    if (firstEnabledOption) {
      setSelectedTargetLength(firstEnabledOption.value);
    }
  }, [isSelectedTargetLengthDisabled, targetLengthOptions]);

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
        {shouldRenderHeroImage ? (
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

        {adaptedArticle ? (
          <View style={styles.articleMeta}>
            <ThemedText type="description" style={styles.infoText}>
              {showAdaptedText
                ? t('article.adaptedState', {
                    adaptedLength: adaptedArticle.adaptedLength,
                    level: adaptedArticle.level,
                    originalLength: adaptedArticle.originalLength,
                    targetLength: adaptedArticle.targetLength
                      ? t(`article.lengths.${adaptedArticle.targetLength}`)
                      : t('article.lengths.original'),
                  })
                : t('article.originalState', {
                    level: adaptedArticle.level,
                    originalLength: adaptedArticle.originalLength,
                    targetLength: adaptedArticle.targetLength
                      ? t(`article.lengths.${adaptedArticle.targetLength}`)
                      : t('article.lengths.original'),
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
        isAddToDictionaryDisabled={
          isTranslationLoading ||
          Boolean(translationError) ||
          !translation?.translation ||
          dictionaryMutation.isPending
        }
        loading={isTranslationLoading}
        onAddToDictionary={handleAddToDictionary}
        onClose={handleCloseTranslation}
        open={selectedWord !== null}
        translation={translation?.translation}
        word={selectedWord?.word}
      />
      <ModalSheet
        contentStyle={styles.adaptModalContent}
        onClose={handleCloseAdaptSettings}
        open={isAdaptSettingsOpen}
        title={t('article.adaptText')}>
        {adaptedArticle ? (
          <SegmentedToggle
            onChange={(value) => {
              if (value === 'adapted') {
                handleShowAdaptedPress();
                return;
              }

              handleShowOriginalPress();
            }}
            options={[
              { label: t('article.textMode.adapted'), value: 'adapted' },
              { label: t('article.textMode.original'), value: 'original' },
            ]}
            selectedValue={showAdaptedText ? 'adapted' : 'original'}
          />
        ) : null}
        <View style={styles.adaptModalFields}>
          <View style={styles.adaptModalPickerField}>
            <OptionPickerField
              label={t('article.levelLabel')}
              onSelect={setSelectedLevel}
              options={levelOptions}
              selectedValue={selectedLevel}
              title={t('article.levelPickerTitle')}
            />
          </View>
          <View style={styles.adaptModalPickerField}>
            <OptionPickerField
              label={t('article.lengthLabel')}
              onSelect={setSelectedTargetLength}
              options={targetLengthOptions}
              selectedValue={selectedTargetLength}
              title={t('article.lengthPickerTitle')}
            />
          </View>
        </View>
        <Button
          disabled={simplifyMutation.isPending || isSelectedTargetLengthDisabled}
          onPress={handleAdaptFromModal}
          variant="primary">
          {simplifyMutation.isPending ? t('article.adapting') : t('article.adaptText')}
        </Button>
      </ModalSheet>
      {!isAdaptSettingsOpen ? (
        <Cta
          layout="vertical"
          primaryAction={{
            label: t('article.reinforceKnowledge'),
            onPress: () => {},
          }}
          secondaryAction={{
            label: t('article.configureText'),
            onPress: handleOpenAdaptSettings,
            variant: 'secondary',
          }}
          withBackground
        />
      ) : null}
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

function hasDuplicateArticleImage(
  thumbnailUrl: string,
  blocks: ArticleBlock[],
): boolean {
  const normalizedThumbnailIdentity = getWikipediaImageIdentity(thumbnailUrl);

  if (!normalizedThumbnailIdentity) {
    return false;
  }

  return blocks.some((block) => {
    return (
      block.type === 'image' &&
      getWikipediaImageIdentity(block.src) === normalizedThumbnailIdentity
    );
  });
}

function getWikipediaImageIdentity(imageUrl: string): string | null {
  try {
    const { pathname } = new URL(imageUrl);
    const pathSegments = pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0) {
      return null;
    }

    const thumbIndex = pathSegments.findIndex((segment) => segment === 'thumb');
    const rawFileName =
      thumbIndex >= 0 && thumbIndex + 3 < pathSegments.length
        ? pathSegments[pathSegments.length - 2]
        : pathSegments[pathSegments.length - 1];

    if (!rawFileName) {
      return null;
    }

    return decodeURIComponent(rawFileName)
      .replace(/^\d+px-/, '')
      .trim()
      .toLowerCase();
  } catch {
    return imageUrl.trim().toLowerCase() || null;
  }
}

function countSentences(text: string): number {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return 0;
  }

  const matches = normalizedText.match(/[.!?]+(?=\s|$)/g);
  return matches?.length ?? 1;
}

