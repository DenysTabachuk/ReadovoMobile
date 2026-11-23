import type { ImageProps } from 'expo-image';
import type { ReactNode } from 'react';
import { ImageWithFallback } from '@/components/imageWithFallback';
import { useLearningMediaQuery } from '../../api/queries/useLearningMediaQuery';

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
  const { data } = useLearningMediaQuery(imageUrl);

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
