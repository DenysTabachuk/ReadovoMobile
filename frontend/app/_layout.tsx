import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '@/localization';
import '@/devtools/reactotron';
import 'react-native-reanimated';

import { BannerProvider } from '@/components/banner';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/providers/authProvider';
import { PreferencesProvider } from '@/providers/preferencesProvider';
import { QueryProvider } from '@/providers/queryProvider';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </PreferencesProvider>
  );
}

function RootLayoutContent() {
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = Colors[colorScheme].background;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    void NavigationBar.setButtonStyleAsync(
      colorScheme === 'dark' ? 'light' : 'dark',
    );
  }, [backgroundColor, colorScheme]);

  return (
    <View style={{ backgroundColor, flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <QueryProvider>
            <BannerProvider>
              <Stack
                screenOptions={{
                  contentStyle: {
                    backgroundColor,
                  },
                }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="about" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="register" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="article/[id]" />
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
          </QueryProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </View>
  );
}
