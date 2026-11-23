import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import type { CatalogueTab } from '../../types';
import { createStyles } from './styles';

type CatalogueTabsProps = {
  selectedTab: CatalogueTab;
  onSelectTab: (tab: CatalogueTab) => void;
};

const CATALOGUE_TABS: readonly CatalogueTab[] = ['all', 'saved', 'completed'];

export function CatalogueTabs({
  selectedTab,
  onSelectTab,
}: CatalogueTabsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {CATALOGUE_TABS.map((tab) => {
        const selected = selectedTab === tab;
        const label = t(`learning.topics.tabs.${tab}`);
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => onSelectTab(tab)}
            style={[styles.tab, selected && styles.activeTab]}
          >
            <ThemedText
              type="bodyStrong"
              style={[styles.tabText, selected && styles.activeTabText]}
            >
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
