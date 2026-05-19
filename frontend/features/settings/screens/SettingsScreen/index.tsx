import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import { Button } from '@/components/button';
import { CheckboxRow } from '@/components/checkboxRow';
import { useAuth } from '@/providers/authProvider';
import { usePreferences } from '@/providers/preferencesProvider';
import { LanguageSelector } from '@/components/languageSelector';
import { ModalSheet } from '@/components/modalSheet';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { IconSymbol } from '@/components/iconSymbol';
import { TimePickerField } from '@/components/timePickerField';

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
  const [pendingReminderEnabled, setPendingReminderEnabled] = useState<boolean | null>(null);
  const [versionTapCount, setVersionTapCount] = useState(0);
  const appVersion = Constants.expoConfig?.version ?? 'dev';

  const handleToggleTheme = () => {
    setThemePreference(isDarkTheme ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleLearningReminderPress = async () => {
    const nextEnabled = !learningReminderEnabled;

    if (!nextEnabled) {
      setPendingReminderEnabled(false);
      return;
    }

    try {
      const permissions = await Notifications.getPermissionsAsync();
      if (!permissions.granted && permissions.canAskAgain) {
        await setLearningReminderEnabled(true);
        return;
      }
    } catch {
      // Fall through to the in-app confirmation if permission state cannot be read.
    }

    setPendingReminderEnabled(true);
  };

  const handleCloseLearningReminderModal = () => {
    setPendingReminderEnabled(null);
  };

  const handleConfirmLearningReminderChange = async () => {
    if (pendingReminderEnabled === null) {
      return;
    }

    await setLearningReminderEnabled(pendingReminderEnabled);
    setPendingReminderEnabled(null);
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
                void handleLearningReminderPress();
              }}
            />
          </View>
          <TimePickerField
            containerStyle={styles.learningReminderTimeField}
            label={t('settings.learningReminders.timeLabel')}
            onChange={(value) => {
              void setLearningReminderTime(value);
            }}
            value={learningReminderTime}
          />
        </View>

        <ModalSheet
          footer={
            <View style={styles.modalFooter}>
              <Button
                onPress={handleCloseLearningReminderModal}
                style={styles.modalButton}
                variant="secondary">
                {t('settings.learningReminders.confirmModal.cancel')}
              </Button>
              <Button
                onPress={() => void handleConfirmLearningReminderChange()}
                style={styles.modalButton}>
                {pendingReminderEnabled
                  ? t('settings.learningReminders.confirmModal.enableConfirm')
                  : t('settings.learningReminders.confirmModal.disableConfirm')}
              </Button>
            </View>
          }
          onClose={handleCloseLearningReminderModal}
          open={pendingReminderEnabled !== null}
          title={
            pendingReminderEnabled
              ? t('settings.learningReminders.confirmModal.enableTitle')
              : t('settings.learningReminders.confirmModal.disableTitle')
          }>
          <View style={styles.modalContent}>
            <ThemedText type="description">
              {pendingReminderEnabled
                ? t('settings.learningReminders.confirmModal.enableDescription')
                : t('settings.learningReminders.confirmModal.disableDescription')}
            </ThemedText>
          </View>
        </ModalSheet>

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
            {t('settings.version', { version: appVersion })}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
