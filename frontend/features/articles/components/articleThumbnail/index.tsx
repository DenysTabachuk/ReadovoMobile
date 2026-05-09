import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themedText';

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
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    setHasLoadError(false);
  }, [thumbnailUrl]);

  if (!thumbnailUrl || hasLoadError) {
    const fallbackLetter = title.trim().charAt(0).toUpperCase();

    return (
      <View style={[styles.placeholder, { borderColor }]}>
        {fallbackLetter ? (
          <ThemedText type="sectionTitle" style={{ color: iconColor }}>
            {fallbackLetter}
          </ThemedText>
        ) : (
          <Ionicons color={iconColor} name="image-outline" size={24} />
        )}
      </View>
    );
  }

  return (
    <Image
      accessibilityIgnoresInvertColors
      cachePolicy="disk"
      contentFit="cover"
      onError={() => setHasLoadError(true)}
      source={{ uri: thumbnailUrl }}
      style={styles.image}
      transition={100}
    />
  );
}
