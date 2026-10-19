import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
export function useArticlesFilterTheme() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const borderColor = useThemeColor(
    { light: '#d0d7de', dark: '#2d3336' },
    'text',
  );
  const cardColor = useThemeColor(
    { light: '#f5f7fa', dark: '#202425' },
    'background',
  );
  const sectionCardColor = useThemeColor(
    { light: '#edf1f5', dark: '#171c1d' },
    'background',
  );
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor(
    { light: '#7c7c7c', dark: '#a8a8a8' },
    'icon',
  );
  const mutedTextColor = useThemeColor(
    { light: '#687076', dark: '#9ba1a6' },
    'icon',
  );
  const darkFilterIconColor = '#a5b4fc';
  const clearIconColor = isDarkMode ? darkFilterIconColor : tintColor;
  const savedAccentColor = isDarkMode ? '#c4a7ff' : tintColor;
  const selectedCategoryBackground = useThemeColor(
    { light: '#e8f5f9', dark: '#2a2141' },
    'background',
  );
  const selectedCategoryColor = isDarkMode ? '#d9c7ff' : tintColor;
  return {
    isDarkMode,
    borderColor,
    cardColor,
    sectionCardColor,
    tintColor,
    textColor,
    placeholderColor,
    mutedTextColor,
    darkFilterIconColor,
    clearIconColor,
    savedAccentColor,
    selectedCategoryBackground,
    selectedCategoryColor,
  };
}
