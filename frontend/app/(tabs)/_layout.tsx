import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { HapticTab } from '@/components/hapticTab';
import { IconSymbol } from '@/components/iconSymbol';
import { useTheme } from '@/hooks/use-theme';

export default function TabLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 1,
          elevation: 0,
          height: 60,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.articles'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="newspaper.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dictionary"
        options={{
          title: t('tabs.dictionary'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="book.closed.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={24}
              name="person.crop.circle.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="slider.horizontal.3" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
