import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/button';
import { OptionPickerField } from '@/components/optionPickerField';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { sendRemoteTestPush } from '@/features/learningReminders/api';
import { registerCurrentDevicePushToken } from '@/features/learningReminders/service';
import { getStreakProfile } from '@/features/streak/api';
import { useAuth } from '@/providers/authProvider';

import { styles } from './styles';

type DelayOption = '5' | '10' | '20' | '30';
type ScenarioOption = 'smart-check' | 'force-send';

export default function NotificationTestScreen() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<string>('');
  const [delaySeconds, setDelaySeconds] = useState<DelayOption>('10');
  const [scenario, setScenario] = useState<ScenarioOption>('smart-check');

  if (!__DEV__) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.content}>
          <ThemedText type="screenTitle">
            {t('settings.notificationTest.screenTitle', {
              defaultValue: 'Notification Test',
            })}
          </ThemedText>
          <ThemedText type="description">
            {t('settings.notificationTest.unavailable', {
              defaultValue: 'This screen is available only in development builds.',
            })}
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  const handleSendTestNotification = async () => {
    try {
      const existingPermissions = await Notifications.getPermissionsAsync();
      const hasPermission = existingPermissions.granted
        ? true
        : existingPermissions.canAskAgain
          ? (await Notifications.requestPermissionsAsync()).granted
          : false;

      if (!hasPermission) {
        setStatus(
          t('settings.notificationTest.permissionDenied', {
            defaultValue: 'Notifications permission is disabled on this device.',
          }),
        );
        return;
      }

      if (scenario === 'smart-check') {
        if (!currentUser?.id) {
          setStatus('No user id found. Please sign in again.');
          return;
        }

        const streakProfile = await getStreakProfile(currentUser.id);
        if (streakProfile.todayStatus === 'completed') {
          setStatus(
            `Skipped: today's test is already completed (${streakProfile.todayStatus}).`,
          );
          return;
        }
      }

      const seconds = Number(delaySeconds);
      const title =
        scenario === 'smart-check'
          ? 'Readovo learning reminder'
          : 'Readovo force test notification';
      const body =
        scenario === 'smart-check'
          ? 'You have not completed a test today. Return to Readovo and keep your streak.'
          : 'Forced notification: use this to validate tray icon and delivery behavior.';

      await Notifications.scheduleNotificationAsync({
        content: {
          body,
          title,
        },
        trigger: {
          seconds,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
      });

      setStatus(`Scheduled in ${seconds}s. You can now minimize the app.`);
    } catch {
      setStatus(
        t('settings.notificationTest.failed', {
          defaultValue: 'Failed to schedule test notification.',
        }),
      );
    }
  };

  const handleSendRemoteTestPush = async () => {
    if (!currentUser?.id) {
      setStatus('No user id found. Please sign in again.');
      return;
    }

    try {
      const response = await sendRemoteTestPush(currentUser.id);
      if (response.sentCount === 0) {
        setStatus('No active push tokens found for this user/device.');
        return;
      }

      setStatus(
        `Remote push sent to ${response.sentCount} device token(s). Now fully close the app and verify delivery.`,
      );
    } catch {
      setStatus('Failed to send remote test push from backend.');
    }
  };

  const handleRefreshPushToken = async () => {
    console.log('[NotificationTest] Refresh/Register push token button pressed');

    if (!currentUser?.id) {
      console.log('[NotificationTest] Missing currentUser.id');
      setStatus('No user id found. Please sign in again.');
      return;
    }

    try {
      console.log(`[NotificationTest] Registering token for user ${currentUser.id}`);
      const registered = await registerCurrentDevicePushToken(currentUser.id);
      console.log(`[NotificationTest] registerCurrentDevicePushToken result=${String(registered)}`);
      if (!registered) {
        setStatus('Push permission is disabled. Enable it in OS settings first.');
        return;
      }

      setStatus('Push token refreshed and registered for this device.');
    } catch (error) {
      console.log('[NotificationTest] Failed to refresh/register push token', error);
      setStatus('Failed to refresh/register push token.');
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="screenTitle">
          {t('settings.notificationTest.screenTitle', {
            defaultValue: 'Notification Test',
          })}
        </ThemedText>
        <ThemedText type="description">
          {t('settings.notificationTest.description', {
            defaultValue:
              'Use scenarios below to test reminder logic and Android tray behavior.',
          })}
        </ThemedText>
        <OptionPickerField
          label="Scenario"
          onSelect={(value) => setScenario(value as ScenarioOption)}
          options={[
            {
              description: 'Checks streak first and sends only when today is not completed.',
              label: 'Smart check',
              value: 'smart-check',
            },
            {
              description: 'Always sends notification for icon/delivery testing.',
              label: 'Force send',
              value: 'force-send',
            },
          ]}
          selectedValue={scenario}
          title="Select notification scenario"
        />
        <OptionPickerField
          label="Delay before send"
          onSelect={(value) => setDelaySeconds(value as DelayOption)}
          options={[
            { label: '5 sec', value: '5' },
            { label: '10 sec', value: '10' },
            { label: '20 sec', value: '20' },
            { label: '30 sec', value: '30' },
          ]}
          selectedValue={delaySeconds}
          title="Select delay"
        />
        <Button onPress={() => void handleSendTestNotification()}>
          {t('settings.notificationTest.sendButton', {
            defaultValue: 'Send test notification',
          })}
        </Button>
        <Button onPress={() => void handleRefreshPushToken()} variant="secondary">
          Refresh/Register push token now
        </Button>
        <Button onPress={() => void handleSendRemoteTestPush()} variant="secondary">
          Send remote push (backend)
        </Button>
        {status ? <ThemedText type="description">{status}</ThemedText> : null}
      </View>
    </ScreenContainer>
  );
}
