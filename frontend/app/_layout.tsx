import { ThemeProvider } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import * as SystemUI from 'expo-system-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '@/localization';
import '@/devtools/reactotron';
import 'react-native-reanimated';

import { FullScreenLoader } from '@/components/fullScreenLoader';
import { BannerProvider } from '@/components/banner';
import { navigationThemes } from '@/constants/navigationTheme';
import { AuthProvider, useAuth } from '@/features/auth';
import {
  loadLearningReminderPreferences,
  syncLearningReminder,
} from '@/features/learningReminders/service';
import { useTheme } from '@/hooks/use-theme';
import {
  PreferencesProvider,
  usePreferences,
} from '@/providers/preferencesProvider';
import { QueryProvider } from '@/providers/queryProvider';

export const unstable_settings = {
  anchor: 'index',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <QueryProvider>
        <AuthProvider>
          <RootLayoutContent />
        </AuthProvider>
      </QueryProvider>
    </PreferencesProvider>
  );
}

function RootLayoutContent() {
  const { t } = useTranslation();
  const { isAuthenticated, currentUser, sessionVersion, isHydratingAuth } =
    useAuth();
  const { theme: colorScheme, colors } = useTheme();
  const {
    isLoadingPreferences,
    hydrateLearningReminderPreferences,
    learningReminderEnabled,
    learningReminderTime,
  } = usePreferences();
  const backgroundColor = colors.background;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    void NavigationBar.setBackgroundColorAsync(backgroundColor);
    void NavigationBar.setButtonStyleAsync(
      colorScheme === 'dark' ? 'light' : 'dark',
    );
  }, [backgroundColor, colorScheme]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) {
      return;
    }

    let isCurrentSession = true;
    void loadLearningReminderPreferences()
      .then((preferences) => {
        if (isCurrentSession) hydrateLearningReminderPreferences(preferences);
      })
      .catch(() => undefined);
    return () => {
      isCurrentSession = false;
    };
  }, [
    currentUser?.id,
    hydrateLearningReminderPreferences,
    isAuthenticated,
    sessionVersion,
  ]);

  useEffect(() => {
    void syncLearningReminder({
      isAuthenticated,
      isReminderEnabled: learningReminderEnabled,
      reminderTime: learningReminderTime,
      userId: currentUser?.id,
    });
  }, [
    currentUser?.id,
    isAuthenticated,
    learningReminderEnabled,
    learningReminderTime,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        return;
      }

      void syncLearningReminder({
        isAuthenticated,
        isReminderEnabled: learningReminderEnabled,
        reminderTime: learningReminderTime,
        userId: currentUser?.id,
      });
    });

    return () => {
      subscription.remove();
    };
  }, [
    currentUser?.id,
    isAuthenticated,
    learningReminderEnabled,
    learningReminderTime,
  ]);

  return (
    <GestureHandlerRootView style={{ backgroundColor, flex: 1 }}>
      <View style={{ backgroundColor, flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider value={navigationThemes[colorScheme]}>
            <BannerProvider>
              {isHydratingAuth || isLoadingPreferences ? (
                <FullScreenLoader />
              ) : (
                <Stack
                  key={sessionVersion}
                  screenOptions={{ contentStyle: { backgroundColor } }}
                >
                  <Stack.Protected guard={!isAuthenticated}>
                    <Stack.Screen
                      name="index"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="about"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="login"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="register"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="forgot-password"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="reset-password"
                      options={{ headerShown: false }}
                    />
                  </Stack.Protected>
                  <Stack.Protected guard={isAuthenticated}>
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen name="wardrobe" />
                    <Stack.Screen name="dictionary-test" />
                    <Stack.Screen name="article/[id]" />
                    <Stack.Screen name="article-quiz/[id]" />
                    <Stack.Screen
                      name="notification-test"
                      options={{ title: t('navigation.notificationTestTitle') }}
                    />
                    <Stack.Screen
                      name="modal"
                      options={{
                        presentation: 'modal',
                        title: t('navigation.modalTitle'),
                      }}
                    />
                  </Stack.Protected>
                </Stack>
              )}
              <StatusBar
                backgroundColor={backgroundColor}
                style={colorScheme === 'dark' ? 'light' : 'dark'}
                translucent={false}
              />
            </BannerProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  );
}
