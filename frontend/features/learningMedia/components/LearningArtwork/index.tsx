import type { ImageProps } from 'expo-image';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ImageWithFallback } from '@/components/imageWithFallback';
import { useTheme } from '@/hooks/use-theme';
import { useLearningMediaQuery } from '../../api/queries/useLearningMediaQuery';
import { styles } from './styles';

type LearningArtworkProps = Pick<ImageProps, 'style' | 'contentFit'> & {
  imageUrl: string | null;
  fallback?: ReactNode;
  previewSource?: string;
  showLoadingIndicator?: boolean;
};

/** Loads private lesson artwork and uses the shared image placeholder. */
export function LearningArtwork({
  imageUrl,
  previewSource,
  showLoadingIndicator = true,
  ...props
}: LearningArtworkProps) {
  if (imageUrl === null) {
    return (
      <ImageWithFallback
        {...props}
        source={previewSource}
        cachePolicy="none"
        accessible={false}
      />
    );
  }

  return (
    <RemoteLearningArtwork
      key={imageUrl}
      imageUrl={imageUrl}
      previewSource={previewSource}
      showLoadingIndicator={showLoadingIndicator}
      {...props}
    />
  );
}

type RemoteLearningArtworkProps = Omit<
  LearningArtworkProps,
  'imageUrl' | 'showLoadingIndicator'
> & {
  imageUrl: string;
  showLoadingIndicator: boolean;
};

function RemoteLearningArtwork({
  imageUrl,
  previewSource,
  showLoadingIndicator,
  fallback,
  ...props
}: RemoteLearningArtworkProps) {
  const { colors } = useTheme();
  const { data, isPending } = useLearningMediaQuery(imageUrl);

  if (isPending && !previewSource) {
    if (!showLoadingIndicator) return null;
    return (
      <View style={[styles.loading, props.style]} accessible={false}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const previewFallback =
    data && previewSource ? (
      <ImageWithFallback
        {...props}
        source={previewSource}
        cachePolicy="none"
        fallback={fallback}
        accessible={false}
      />
    ) : (
      fallback
    );
  return (
    <ImageWithFallback
      {...props}
      source={data ?? previewSource}
      fallback={previewFallback}
      placeholder={data ? previewSource : undefined}
      placeholderContentFit={props.contentFit}
      cachePolicy="none"
      recyclingKey={imageUrl}
      accessible={false}
    />
  );
}
