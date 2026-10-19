import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { styles as sharedStyles } from '../../styles';

import { ThemedText } from '@/components/themedText';

import { styles } from './styles';

import { useArticlesFilterTheme } from '../../hooks/useArticlesFilterTheme';
import type { ArticlesToolbarProps } from '../../types';
type Props = Pick<
  ArticlesToolbarProps,
  | 'personalFilter'
  | 'onChangePersonalFilter'
  | 'savedArticlesCount'
  | 'recentArticlesCount'
>;
export function PersonalArticlesFilter({
  personalFilter,
  onChangePersonalFilter,
  savedArticlesCount,
  recentArticlesCount,
}: Props) {
  const { t } = useTranslation();
  const {
    isDarkMode,
    borderColor,
    cardColor,
    sectionCardColor,
    mutedTextColor,
    savedAccentColor,
    selectedCategoryBackground,
    selectedCategoryColor,
  } = useArticlesFilterTheme();
  return (
    <>
      <View
        style={[
          sharedStyles.sectionCard,
          {
            backgroundColor: sectionCardColor,
            borderColor,
          },
        ]}
      >
        <View style={sharedStyles.sectionHeader}>
          <ThemedText
            type="body"
            style={[sharedStyles.sectionHeaderText, { color: mutedTextColor }]}
          >
            {t('articles.filtersSections.personal')}
          </ThemedText>
        </View>

        <View style={sharedStyles.categorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={sharedStyles.categoryList}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('articles.recent.openAction')}
              accessibilityState={{
                selected: personalFilter === 'recent',
              }}
              onPress={() =>
                onChangePersonalFilter(
                  personalFilter === 'recent' ? null : 'recent',
                )
              }
              style={({ pressed }) => [
                sharedStyles.categoryChip,
                {
                  backgroundColor:
                    personalFilter === 'recent'
                      ? selectedCategoryBackground
                      : cardColor,
                  borderColor:
                    personalFilter === 'recent'
                      ? selectedCategoryColor
                      : borderColor,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Ionicons
                color={
                  personalFilter === 'recent'
                    ? selectedCategoryColor
                    : mutedTextColor
                }
                name={personalFilter === 'recent' ? 'eye' : 'eye-outline'}
                size={18}
              />
              <ThemedText
                numberOfLines={1}
                type="bodyStrong"
                style={[
                  sharedStyles.categoryChipLabel,
                  {
                    color:
                      personalFilter === 'recent'
                        ? selectedCategoryColor
                        : mutedTextColor,
                  },
                ]}
              >
                {t('articles.recent.label')}
              </ThemedText>
              <ThemedText
                type="bodyStrong"
                style={[
                  styles.savedCount,
                  {
                    color:
                      personalFilter === 'recent'
                        ? selectedCategoryColor
                        : mutedTextColor,
                  },
                ]}
              >
                {recentArticlesCount}
              </ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('articles.saved.openAction')}
              accessibilityState={{
                selected: personalFilter === 'saved',
              }}
              onPress={() =>
                onChangePersonalFilter(
                  personalFilter === 'saved' ? null : 'saved',
                )
              }
              style={({ pressed }) => [
                sharedStyles.categoryChip,
                {
                  backgroundColor:
                    personalFilter === 'saved'
                      ? selectedCategoryBackground
                      : cardColor,
                  borderColor:
                    personalFilter === 'saved' ? savedAccentColor : borderColor,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Ionicons
                color={
                  personalFilter === 'saved'
                    ? savedAccentColor
                    : isDarkMode
                      ? '#a78bfa'
                      : mutedTextColor
                }
                name={
                  personalFilter === 'saved' ? 'bookmark' : 'bookmark-outline'
                }
                size={18}
              />
              <ThemedText
                numberOfLines={1}
                type="bodyStrong"
                style={[
                  sharedStyles.categoryChipLabel,
                  {
                    color:
                      personalFilter === 'saved'
                        ? savedAccentColor
                        : mutedTextColor,
                  },
                ]}
              >
                {t('articles.saved.label')}
              </ThemedText>
              <ThemedText
                type="bodyStrong"
                style={[
                  styles.savedCount,
                  {
                    color:
                      personalFilter === 'saved'
                        ? savedAccentColor
                        : mutedTextColor,
                  },
                ]}
              >
                {savedArticlesCount}
              </ThemedText>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </>
  );
}
