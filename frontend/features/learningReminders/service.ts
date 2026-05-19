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
    return stored;
  }

  const nextValue = generateDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, nextValue);
  return nextValue;
}

async function requestPushPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) {
    return true;
  }

  if (!existing.canAskAgain) {
    return false;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    importance: Notifications.AndroidImportance.DEFAULT,
    name: 'default',
    sound: 'default',
  });
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

  const pushTokenResponse = await Notifications.getDevicePushTokenAsync();
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
