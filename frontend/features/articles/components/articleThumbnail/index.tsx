import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { ImageWithFallback } from '@/components/imageWithFallback';

import { styles } from './styles';

type ArticleThumbnailProps = {
  borderColor: string;
  iconColor: string;
  thumbnailUrl?: string;
  title: string;
};

export function ArticleThumbnail({
  borderColor,
  iconColor,
  thumbnailUrl,
  title,
}: ArticleThumbnailProps) {
  const fallbackLetter = title.trim().charAt(0).toUpperCase();

  return (
    <ImageWithFallback
      accessibilityIgnoresInvertColors
      cachePolicy="disk"
      contentFit="cover"
      source={thumbnailUrl}
      style={styles.image}
      transition={100}
      fallback={
        <View style={[styles.placeholder, { borderColor }]}>
          {fallbackLetter ? (
            <ThemedText type="sectionTitle" style={{ color: iconColor }}>
              {fallbackLetter}
            </ThemedText>
          ) : (
            <Ionicons color={iconColor} name="image-outline" size={24} />
          )}
        </View>
      }
    />
  );
}
