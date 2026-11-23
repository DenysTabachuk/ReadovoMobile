import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/button';
import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

type CatalogueToolbarProps = {
  search: string;
  searchLabel: string;
  onSearchChange: (value: string) => void;
};

export function CatalogueToolbar({
  search,
  searchLabel,
  onSearchChange,
}: CatalogueToolbarProps) {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  return (
    <>
      <View style={styles.toolbar}>
        <View style={styles.search}>
          <Ionicons
            name="search-outline"
            size={22}
            color={colors.textSecondary}
            accessible={false}
          />
          <TextInput
            value={search}
            onChangeText={onSearchChange}
            accessibilityLabel={searchLabel}
            placeholder={searchLabel}
            placeholderTextColor={colors.placeholder}
            selectionColor={colors.interactive}
            keyboardAppearance={theme}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('learning.topics.clearSearch')}
              onPress={() => onSearchChange('')}
              style={styles.clearSearch}
            >
              <Ionicons
                name="close-outline"
                size={22}
                color={colors.textSecondary}
              />
            </Pressable>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('learning.topics.filters')}
          accessibilityState={{ expanded: filtersOpen }}
          onPress={() => setFiltersOpen(true)}
          style={({ pressed }) => [
            styles.filters,
            pressed && styles.filtersPressed,
          ]}
        >
          <Ionicons
            name="options-outline"
            size={22}
            color={colors.interactive}
            accessible={false}
          />
        </Pressable>
      </View>
      <ModalSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('learning.topics.filters')}
        footer={
          <Button onPress={() => setFiltersOpen(false)}>
            {t('learning.topics.closeFilters')}
          </Button>
        }
      >
        <ThemedText>{t('learning.topics.filtersSoon')}</ThemedText>
      </ModalSheet>
    </>
  );
}
