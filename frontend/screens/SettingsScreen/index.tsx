import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/providers/preferencesProvider';
import { LanguageSelector } from '@/components/languageSelector';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { IconSymbol } from '@/components/ui/iconSymbol';

import { styles } from './styles';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { setThemePreference, themePreference } = usePreferences();
  const isDarkTheme = themePreference === 'dark';

  const handleToggleTheme = () => {
    setThemePreference(isDarkTheme ? 'light' : 'dark');
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="screenTitle">{t('settings.title')}</ThemedText>
        <ThemedText type="description" style={styles.description}>
          {t('settings.description')}
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="sectionTitle">{t('settings.theme.title')}</ThemedText>
        <View style={styles.themeRow}>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: isDarkTheme }}
            onPress={handleToggleTheme}
            style={[
              styles.themeToggle,
              isDarkTheme ? styles.themeToggleDark : styles.themeToggleLight,
            ]}>
            <View
              style={[
                styles.themeThumb,
                isDarkTheme ? styles.themeThumbDark : styles.themeThumbLight,
              ]}>
              <IconSymbol
                color={isDarkTheme ? '#ffffff' : '#ffcf33'}
                name={isDarkTheme ? 'moon.fill' : 'sun.max.fill'}
                size={28}
              />
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="sectionTitle">{t('settings.language.title')}</ThemedText>
        <LanguageSelector />
      </View>
    </ScreenContainer>
  );
}
