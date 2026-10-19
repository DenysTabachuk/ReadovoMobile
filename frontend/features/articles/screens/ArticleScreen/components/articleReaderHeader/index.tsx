import { ThemedText } from '@/components/themedText';
import type {
  ArticleBlock,
  WikipediaArticleDetail,
} from '@/features/articles/api';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import type { ArticleTransformationDetails } from '../../types';
import type { useArticleSpeech } from '../../useArticleSpeech';
import { hasDuplicateArticleImage } from '../../utils';
import { ArticleSpeechControls } from '../articleSpeechControls';
import { ArticleMetrics } from './components/articleMetrics';
import { ArticleTransformationStatus } from './components/articleTransformationStatus';
import { styles } from './styles';
type Props = {
  article: WikipediaArticleDetail;
  displayedBlocks?: ArticleBlock[];
  articleSpeech: ReturnType<typeof useArticleSpeech>;
  transformation: ArticleTransformationDetails;
  handleSpeechControlsLayout: (event: LayoutChangeEvent) => void;
};

const HERO_IMAGE_TRANSITION_MS = 120;

export function ArticleReaderHeader({
  article,
  displayedBlocks,
  articleSpeech,
  transformation,
  handleSpeechControlsLayout,
}: Props) {
  const { t } = useTranslation();
  const [hasImageLoadError, setHasImageLoadError] = useState(false);
  const shouldRenderHeroImage = useMemo(() => {
    if (!article?.thumbnailUrl || hasImageLoadError) {
      return false;
    }

    return !hasDuplicateArticleImage(
      article.thumbnailUrl,
      displayedBlocks ?? article.blocks,
    );
  }, [
    article?.blocks,
    article?.thumbnailUrl,
    displayedBlocks,
    hasImageLoadError,
  ]);
  useEffect(() => {
    setHasImageLoadError(false);
  }, [article.thumbnailUrl]);
  return (
    <View style={styles.listHeader}>
      {shouldRenderHeroImage ? (
        <Image
          cachePolicy="disk"
          contentFit="cover"
          onError={() => setHasImageLoadError(true)}
          source={{ uri: article.thumbnailUrl }}
          style={styles.heroImage}
          transition={HERO_IMAGE_TRANSITION_MS}
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

      <ArticleTransformationStatus {...transformation} />
      {transformation.displayedArticle ? (
        <ArticleMetrics
          originalText={article.content}
          adaptedBlocks={transformation.displayedArticle.adaptedBlocks}
        />
      ) : null}

      <ArticleSpeechControls
        disabled={!articleSpeech.canSpeak}
        onLayout={handleSpeechControlsLayout}
        onRestart={articleSpeech.restart}
        onStop={() => {
          void articleSpeech.stop();
        }}
        onTogglePlayPause={articleSpeech.togglePlayPause}
        progress={articleSpeech.progress}
        status={articleSpeech.status}
      />
    </View>
  );
}
