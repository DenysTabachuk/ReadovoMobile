import AsyncStorage from '@react-native-async-storage/async-storage';
// eslint-disable-next-line import/no-unresolved
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { LearningReminderTime } from '@/providers/preferencesProvider';
import {
  getLearningReminderPreferences,
  registerPushToken,
  updateLearningReminderPreferences,
} from './api';

const DEVICE_ID_STORAGE_KEY = 'readovo.notifications.deviceId';
let hasLoggedReminderSyncError = false;

type SyncLearningReminderInput = {
  isAuthenticated: boolean;
  isReminderEnabled: boolean;
  reminderTime: LearningReminderTime;
  userId: string | null | undefined;
};

function generateDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function getDeviceId(): Promise<string> {
  const stored = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (stored) {
    console.log(`[LearningReminders] using stored deviceId=${stored}`);
    return stored;
  }

  const nextValue = generateDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, nextValue);
  console.log(`[LearningReminders] generated new deviceId=${nextValue}`);
  return nextValue;
}

async function requestPushPermission(): Promise<boolean> {
  console.log('[LearningReminders] reading push permissions');
  const existing = await Notifications.getPermissionsAsync();
  console.log('[LearningReminders] existing push permissions', existing);
  if (existing.granted) {
    return true;
  }

  if (!existing.canAskAgain) {
    console.warn('[LearningReminders] push permission denied and cannot ask again');
    return false;
  }

  console.log('[LearningReminders] requesting push permissions');
  const requested = await Notifications.requestPermissionsAsync();
  console.log('[LearningReminders] requested push permissions', requested);
  return requested.granted;
}

async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  console.log('[LearningReminders] creating Android notification channel default');
  await Notifications.setNotificationChannelAsync('default', {
    importance: Notifications.AndroidImportance.DEFAULT,
    name: 'default',
    sound: 'default',
  });
  console.log('[LearningReminders] Android notification channel default ready');
}

export async function registerCurrentDevicePushToken(
  userId: string,
): Promise<boolean> {
  console.log(`[LearningReminders] registerCurrentDevicePushToken start userId=${userId}`);
  const hasPermission = await requestPushPermission();
  console.log(`[LearningReminders] push permission granted=${String(hasPermission)}`);
  if (!hasPermission) {
    return false;
  }

  await ensureAndroidNotificationChannel();

  console.log('[LearningReminders] requesting native device push token');
  const pushTokenResponse = await Notifications.getDevicePushTokenAsync();
  console.log('[LearningReminders] native device push token response', {
    tokenPrefix: pushTokenResponse.data.slice(0, 24),
    tokenType: pushTokenResponse.type,
  });
  if (pushTokenResponse.type !== 'android') {
    console.warn(
      `[LearningReminders] Firebase Cloud Messaging token registration is supported only on Android. tokenType=${pushTokenResponse.type}`,
    );
    return false;
  }

  const deviceId = await getDeviceId();
  console.log(
    `[LearningReminders] got FCM token and device id. deviceId=${deviceId}, tokenPrefix=${pushTokenResponse.data.slice(0, 24)}`,
  );

  await registerPushToken(userId, {
    deviceId,
    platform: 'android',
    provider: 'fcm',
    pushToken: pushTokenResponse.data,
  });
  console.log('[LearningReminders] registerPushToken request completed');

  return true;
}

export async function syncLearningReminder(input: SyncLearningReminderInput): Promise<void> {
  const { isAuthenticated, isReminderEnabled, reminderTime, userId } = input;

  if (!isAuthenticated || !userId) {
    return;
  }

  try {
    await updateLearningReminderPreferences(userId, {
      learningReminderTime: reminderTime,
      learningRemindersEnabled: isReminderEnabled,
    });

    if (!isReminderEnabled) {
      return;
    }

    const tokenRegistered = await registerCurrentDevicePushToken(userId);
    if (!tokenRegistered) {
      return;
    }
    hasLoggedReminderSyncError = false;
  } catch (error) {
    if (!hasLoggedReminderSyncError) {
      console.warn('Learning reminder sync failed', error);
      hasLoggedReminderSyncError = true;
    }
  }
}

export async function loadLearningReminderPreferences(userId: string): Promise<{
  learningReminderTime: LearningReminderTime;
  learningRemindersEnabled: boolean;
}> {
  return getLearningReminderPreferences(userId);
}
