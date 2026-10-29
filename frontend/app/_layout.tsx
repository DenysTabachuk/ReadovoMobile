import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import * as SystemUI from 'expo-system-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '@/localization';
import '@/devtools/reactotron';
import 'react-native-reanimated';

import { BannerProvider } from '@/components/banner';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/features/auth';
import {
  loadLearningReminderPreferences,
  syncLearningReminder,
} from '@/features/learningReminders/service';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
  const { isAuthenticated, currentUser } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const {
    hydrateLearningReminderPreferences,
    learningReminderEnabled,
    learningReminderTime,
  } = usePreferences();
  const backgroundColor = Colors[colorScheme].background;

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

    void loadLearningReminderPreferences(currentUser.id)
      .then((preferences) => {
        hydrateLearningReminderPreferences(preferences);
      })
      .catch(() => undefined);
  }, [currentUser?.id, hydrateLearningReminderPreferences, isAuthenticated]);

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
          <ThemeProvider
            value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
          >
            <BannerProvider>
              <Stack
                screenOptions={{
                  contentStyle: {
                    backgroundColor,
                  },
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="about" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
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
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="dictionary-test" />
                <Stack.Screen name="article/[id]" />
                <Stack.Screen name="article-quiz/[id]" />
                <Stack.Screen
                  name="notification-test"
                  options={{ title: 'Notification Test' }}
                />
                <Stack.Screen
                  name="modal"
                  options={{ presentation: 'modal', title: 'Modal' }}
                />
              </Stack>
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
