import * as Notifications from 'expo-notifications';
import { registerPushToken } from './api';
import { registerCurrentDevicePushToken } from './service';

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => 'device-42'),
  setItem: jest.fn(),
}));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  setNotificationChannelAsync: jest.fn(),
  getDevicePushTokenAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));
jest.mock('./api', () => ({
  registerPushToken: jest.fn(),
  updateLearningReminderPreferences: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest
    .mocked(Notifications.getDevicePushTokenAsync)
    .mockResolvedValue({ type: 'android', data: 'native-push-token' });
});
afterEach(() => jest.restoreAllMocks());

it('registers the current device without sending an owner ID', async () => {
  await expect(registerCurrentDevicePushToken('account-a')).resolves.toBe(true);
  expect(registerPushToken).toHaveBeenCalledWith({
    deviceId: 'device-42',
    platform: 'android',
    provider: 'fcm',
    pushToken: 'native-push-token',
  });
});
