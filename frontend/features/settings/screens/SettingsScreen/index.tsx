import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import { CheckboxRow } from '@/components/checkboxRow';
import { OptionPickerField } from '@/components/optionPickerField';
import { useAuth } from '@/providers/authProvider';
import { type LearningReminderTime, usePreferences } from '@/providers/preferencesProvider';
import { LanguageSelector } from '@/components/languageSelector';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { IconSymbol } from '@/components/iconSymbol';

import { styles } from './styles';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const {
    colorScheme,
    learningReminderEnabled,
    learningReminderTime,
    setLearningReminderEnabled,
    setLearningReminderTime,
    setThemePreference,
  } = usePreferences();
  const isDarkTheme = colorScheme === 'dark';
  const [versionTapCount, setVersionTapCount] = useState(0);
  const reminderTimeOptions = ['09:00', '12:00', '15:00', '18:00', '19:00', '20:00', '21:00'];
  const appVersion = Constants.expoConfig?.version ?? 'dev';

  const handleToggleTheme = () => {
    setThemePreference(isDarkTheme ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleVersionPress = () => {
    if (!__DEV__) {
      return;
    }

    const nextTapCount = versionTapCount + 1;
    if (nextTapCount >= 5) {
      setVersionTapCount(0);
      router.push('/notification-test');
      return;
    }

    setVersionTapCount(nextTapCount);
  };

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
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
          <ThemedText type="sectionTitle">{t('settings.learningReminders.sectionTitle')}</ThemedText>
          <ThemedText type="description">{t('settings.learningReminders.description')}</ThemedText>
          <View style={styles.learningReminderRow}>
            <CheckboxRow
              checked={learningReminderEnabled}
              label={t('settings.learningReminders.toggleLabel')}
              onPress={() => {
                void setLearningReminderEnabled(!learningReminderEnabled);
              }}
            />
          </View>
          <OptionPickerField
            containerStyle={styles.learningReminderTimeField}
            label={t('settings.learningReminders.timeLabel')}
            onSelect={(value) => {
              void setLearningReminderTime(value as LearningReminderTime);
            }}
            options={reminderTimeOptions.map((value) => ({
              label: value,
              value,
            }))}
            selectedValue={learningReminderTime}
            title={t('settings.learningReminders.timePickerTitle')}
          />
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

        <Pressable
          accessibilityRole="button"
          onPress={handleVersionPress}
          style={styles.versionButton}>
          <ThemedText type="description" style={styles.versionText}>
            {t('settings.version', { defaultValue: 'Version {{version}}', version: appVersion })}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
