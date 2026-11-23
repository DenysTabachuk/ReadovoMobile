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
};

/** Loads private lesson artwork and uses the shared image placeholder. */
export function LearningArtwork({ imageUrl, ...props }: LearningArtworkProps) {
  if (imageUrl === null) {
    return <ImageWithFallback {...props} accessible={false} />;
  }

  return (
    <RemoteLearningArtwork key={imageUrl} imageUrl={imageUrl} {...props} />
  );
}

type RemoteLearningArtworkProps = Omit<LearningArtworkProps, 'imageUrl'> & {
  imageUrl: string;
};

function RemoteLearningArtwork({
  imageUrl,
  ...props
}: RemoteLearningArtworkProps) {
  const { colors } = useTheme();
  const { data, isPending } = useLearningMediaQuery(imageUrl);

  if (isPending) {
    return (
      <View style={[styles.loading, props.style]} accessible={false}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ImageWithFallback
      {...props}
      source={data}
      cachePolicy="none"
      recyclingKey={imageUrl}
      accessible={false}
    />
  );
}
