import { useTheme } from '@/hooks/use-theme';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { createStyles as createSharedStyles } from '../../styles';

import { ThemedText } from '@/components/themedText';

import { styles } from './styles';

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
  const { colors } = useTheme();
  const sharedStyles = useMemo(() => createSharedStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <>
      <View style={[sharedStyles.sectionCard, sharedStyles.filterSurface]}>
        <View style={sharedStyles.sectionHeader}>
          <ThemedText
            type="body"
            style={[sharedStyles.sectionHeaderText, sharedStyles.mutedText]}
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
                sharedStyles.controlSurface,
                personalFilter === 'recent'
                  ? sharedStyles.selectedCategoryChip
                  : null,
                pressed ? sharedStyles.chipPressed : null,
              ]}
            >
              <Ionicons
                color={
                  personalFilter === 'recent'
                    ? colors.onSelection
                    : colors.textSecondary
                }
                name={personalFilter === 'recent' ? 'eye' : 'eye-outline'}
                size={18}
              />
              <ThemedText
                numberOfLines={1}
                type="bodyStrong"
                style={[
                  sharedStyles.categoryChipLabel,
                  personalFilter === 'recent'
                    ? sharedStyles.selectedCategoryText
                    : sharedStyles.mutedText,
                ]}
              >
                {t('articles.recent.label')}
              </ThemedText>
              <ThemedText
                type="bodyStrong"
                style={[
                  styles.savedCount,
                  personalFilter === 'recent'
                    ? sharedStyles.selectedCategoryText
                    : sharedStyles.mutedText,
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
                sharedStyles.controlSurface,
                personalFilter === 'saved'
                  ? sharedStyles.selectedSavedChip
                  : null,
                pressed ? sharedStyles.chipPressed : null,
              ]}
            >
              <Ionicons
                color={
                  personalFilter === 'saved'
                    ? colors.interactive
                    : colors.interactive
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
                  personalFilter === 'saved'
                    ? sharedStyles.selectedSavedText
                    : sharedStyles.mutedText,
                ]}
              >
                {t('articles.saved.label')}
              </ThemedText>
              <ThemedText
                type="bodyStrong"
                style={[
                  styles.savedCount,
                  personalFilter === 'saved'
                    ? sharedStyles.selectedSavedText
                    : sharedStyles.mutedText,
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
