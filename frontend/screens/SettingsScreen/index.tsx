import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/providers/authProvider';
import { usePreferences } from '@/providers/preferencesProvider';
import { LanguageSelector } from '@/components/languageSelector';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { IconSymbol } from '@/components/ui/iconSymbol';

import { styles } from './styles';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { colorScheme, setThemePreference } = usePreferences();
  const isDarkTheme = colorScheme === 'dark';

  const handleToggleTheme = () => {
    setThemePreference(isDarkTheme ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
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

      <View style={styles.section}>
        <ThemedText type="sectionTitle">{t('settings.account.title')}</ThemedText>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons color="#d64545" name="log-out-outline" size={20} />
          <ThemedText type="bodyStrong" style={styles.logoutText}>
            {t('settings.account.logout')}
          </ThemedText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
