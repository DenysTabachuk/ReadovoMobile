import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { HapticTab } from '@/components/hapticTab';
import { achievementsProfileQueryOptions } from '@/features/achievements';
import { getAuthSessionVersion, useAuthenticatedUser } from '@/features/auth';
import { dictionaryWordsQueryOptions } from '@/features/dictionary';
import { mascotProfileQueryOptions } from '@/features/mascot';
import {
  streakCalendarMonthQueryOptions,
  streakProfileQueryOptions,
} from '@/features/streak';
import { useTheme } from '@/hooks/use-theme';

/**
 * Warms the initial Dictionary and Profile reads after the tabs first render.
 * A completed streak read supplies the same server date the calendar uses.
 * @example usePrefetchTabData(); // The tabs render while their data loads.
 */
function usePrefetchTabData() {
  const { id } = useAuthenticatedUser();
  const client = useQueryClient();

  useEffect(() => {
    const sessionVersion = getAuthSessionVersion();
    let stillMounted = true;
    void client.prefetchQuery(dictionaryWordsQueryOptions(id));
    void client.prefetchQuery(achievementsProfileQueryOptions(id));
    void client.prefetchQuery(mascotProfileQueryOptions(id));
    void client.fetchQuery(streakProfileQueryOptions(id)).then(
      (streak) => {
        if (!stillMounted || getAuthSessionVersion() !== sessionVersion) return;
        if (typeof streak?.serverNow !== 'string') return;
        const date = new Date(streak.serverNow);
        if (Number.isNaN(date.getTime())) return;
        void client.prefetchQuery(
          streakCalendarMonthQueryOptions(id, {
            year: date.getUTCFullYear(),
            month: date.getUTCMonth() + 1,
          }),
        );
      },
      () => {
        // The mounted Profile screen handles failed reads and retries.
      },
    );
    return () => {
      stillMounted = false;
    };
  }, [client, id]);
}

export default function TabLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  usePrefetchTabData();

  return (
    <Tabs
      screenOptions={{
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarActiveTintColor: colors.interactive,
        tabBarInactiveTintColor: colors.textSecondary,
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
        name="(learning)"
        options={{
          title: t('learning.topics.title'),
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="book" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grammar"
        options={{
          title: t('learning.grammar.title'),
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="text" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dictionary"
        options={{
          title: t('tabs.dictionary'),
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="library" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="person-circle" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
