import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  View,
  type ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  fetchRandomWikipediaArticles,
  type WikipediaArticle,
} from '@/api/wikipedia';
import { Button } from '@/components/button';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

function getWikipediaLanguageCode(language: string) {
  return language.toLowerCase().startsWith('uk') ? 'uk' : 'en';
}

export default function ArticlesScreen() {
  const { i18n, t } = useTranslation();
  const colorScheme = useColorScheme();
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = colorScheme === 'dark' ? '#2d3336' : '#d0d7de';
  const languageCode = getWikipediaLanguageCode(i18n.language);

  const {
    data: articles = [],
    error,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryFn: () => fetchRandomWikipediaArticles(languageCode),
    queryKey: ['wikipedia', 'randomArticles', languageCode],
  });

  const openArticle = useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  const renderArticle = useCallback<ListRenderItem<WikipediaArticle>>(
    ({ item }) => (
      <Pressable
        style={({ pressed }) => [
          styles.articleCard,
          { borderColor },
          pressed ? styles.articleCardPressed : null,
        ]}
        onPress={() => openArticle(item.url)}>
        {item.thumbnailUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: item.thumbnailUrl }}
            style={styles.articleImage}
          />
        ) : (
          <View style={[styles.imagePlaceholder, { borderColor }]}>
            <ThemedText type="sectionTitle" style={{ color: iconColor }}>
              W
            </ThemedText>
          </View>
        )}

        <View style={styles.articleContent}>
          <ThemedText type="sectionTitle" style={styles.articleTitle}>
            {item.title}
          </ThemedText>
          <ThemedText type="body" style={styles.articleExtract}>
            {item.extract}
          </ThemedText>
        </View>
      </Pressable>
    ),
    [borderColor, iconColor, openArticle]
  );

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="large" />
          <ThemedText type="body">{t('articles.loading')}</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <View style={styles.centerState}>
          <ThemedText type="screenTitle" style={styles.centerTitle}>
            {t('articles.errorTitle')}
          </ThemedText>
          <ThemedText type="description" style={styles.centerDescription}>
            {t('articles.errorDescription')}
          </ThemedText>
          <Button onPress={() => refetch()}>{t('articles.retry')}</Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <FlatList
        data={articles}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="screenTitle">{t('articles.title')}</ThemedText>
            <ThemedText type="description" style={styles.description}>
              {t('articles.description')}
            </ThemedText>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            tintColor={Colors[colorScheme ?? 'light'].tint}
            onRefresh={refetch}
          />
        }
        renderItem={renderArticle}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
