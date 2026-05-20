import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/button';
import { OptionPickerField } from '@/components/optionPickerField';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import {
  clearTodayLearningReminderDispatch,
  dispatchLearningRemindersNow,
  sendRemoteTestPush,
} from '@/features/learningReminders/api';
import { registerCurrentDevicePushToken } from '@/features/learningReminders/service';
import { getStreakProfile } from '@/features/streak/api';
import { useAuth } from '@/providers/authProvider';
import { type LearningReminderTime, usePreferences } from '@/providers/preferencesProvider';

import { styles } from './styles';

type DelayOption = '5' | '10' | '20' | '30';
type ScenarioOption = 'smart-check' | 'force-send';
const LOCAL_TEST_CHANNEL_ID = 'notification-test';

export default function NotificationTestScreen() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const {
    learningReminderEnabled,
    learningReminderTime,
    setLearningReminderEnabled,
    setLearningReminderTime,
  } = usePreferences();
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
      console.log('[NotificationTest] schedule local notification start', {
        delaySeconds,
        scenario,
      });
      const existingPermissions = await Notifications.getPermissionsAsync();
      console.log('[NotificationTest] existing permissions', existingPermissions);
      let hasPermission = existingPermissions.granted;

      if (!hasPermission && existingPermissions.canAskAgain) {
        console.log('[NotificationTest] requesting permissions');
        const requestedPermissions = await Notifications.requestPermissionsAsync();
        console.log('[NotificationTest] requested permissions', requestedPermissions);
        hasPermission = requestedPermissions.granted;
      }

      if (!hasPermission) {
        console.warn('[NotificationTest] local notification skipped: permission denied');
        setStatus(
          t('settings.notificationTest.permissionDenied', {
            defaultValue: 'Notifications permission is disabled on this device.',
          }),
        );
        return;
      }

      if (Platform.OS === 'android') {
        console.log(`[NotificationTest] creating Android channel ${LOCAL_TEST_CHANNEL_ID}`);
        await Notifications.setNotificationChannelAsync(LOCAL_TEST_CHANNEL_ID, {
          importance: Notifications.AndroidImportance.HIGH,
          name: 'Notification test',
          sound: 'default',
        });
        console.log(`[NotificationTest] Android channel ${LOCAL_TEST_CHANNEL_ID} ready`);
      }

      if (scenario === 'smart-check') {
        if (!currentUser?.id) {
          console.warn('[NotificationTest] local notification smart-check skipped: no user id');
          setStatus('No user id found. Please sign in again.');
          return;
        }

        console.log(`[NotificationTest] loading streak profile userId=${currentUser.id}`);
        const streakProfile = await getStreakProfile(currentUser.id);
        console.log('[NotificationTest] streak profile loaded', {
          todayStatus: streakProfile.todayStatus,
        });
        if (streakProfile.todayStatus === 'completed') {
          console.log('[NotificationTest] local notification smart-check skipped: completed today');
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

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          body,
          channelId: LOCAL_TEST_CHANNEL_ID,
          sound: 'default',
          title,
        },
        trigger: {
          seconds,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
      });

      console.log('[NotificationTest] local notification scheduled', {
        notificationId,
        seconds,
      });
      setStatus(`Scheduled in ${seconds}s. You can now minimize the app.`);
    } catch (error) {
      console.error('[NotificationTest] Failed to schedule local notification', error);
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
      console.log(`[NotificationTest] sending remote test push userId=${currentUser.id}`);
      const response = await sendRemoteTestPush(currentUser.id);
      console.log('[NotificationTest] remote test push response', response);
      if (response.tokenCount === 0) {
        setStatus('No active FCM tokens found. Tap "Refresh/Register FCM token" first.');
        return;
      }

      if (response.sentCount === 0) {
        const failureDetails =
          response.failureReasons.length > 0
            ? ` Reason: ${response.failureReasons.join(' | ')}`
            : '';

        setStatus(
          `Found ${response.tokenCount} active FCM token(s), but Firebase did not send the push.${failureDetails}`,
        );
        return;
      }

      setStatus(
        `Backend FCM push sent to ${response.sentCount}/${response.tokenCount} token(s). Fully close the app and verify delivery.`,
      );
    } catch (error) {
      console.error('[NotificationTest] Failed to send backend FCM push', error);
      setStatus('Failed to send backend FCM push.');
    }
  };

  const handleRefreshPushToken = async () => {
    console.log('[NotificationTest] Refresh/Register FCM token button pressed');

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

      setStatus('FCM token refreshed and registered for this device.');
    } catch (error) {
      console.error('[NotificationTest] Failed to refresh/register FCM token', error);
      setStatus('Failed to refresh/register FCM token.');
    }
  };

  const handleSetReminderToNextMinute = async () => {
    const nextMinute = new Date(Date.now() + 60 * 1000);
    const nextReminderTime = `${String(nextMinute.getHours()).padStart(2, '0')}:${String(
      nextMinute.getMinutes(),
    ).padStart(2, '0')}` as LearningReminderTime;

    console.log('[NotificationTest] setting reminder to next minute', {
      nextReminderTime,
    });
    await setLearningReminderEnabled(true);
    await setLearningReminderTime(nextReminderTime);
    setStatus(
      `Learning reminders enabled and time set to ${nextReminderTime}. Wait a moment for sync, then run backend dispatch.`,
    );
  };

  const handleDispatchLearningRemindersNow = async () => {
    try {
      console.log('[NotificationTest] running backend reminder dispatch');
      const result = await dispatchLearningRemindersNow();
      console.log('[NotificationTest] backend reminder dispatch response', result);
      setStatus(
        `Dispatch checked ${result.checkedCount} user(s), sent ${result.sentCount}. Skipped: outside time ${result.skippedOutsideWindowCount}, completed today ${result.skippedCompletedTodayCount}, already sent ${result.skippedAlreadySentCount}, no tokens ${result.skippedNoTokensCount}, send failed ${result.skippedSendFailedCount}.`,
      );
    } catch (error) {
      console.error('[NotificationTest] Failed to run backend reminder dispatch', error);
      setStatus('Failed to run backend reminder dispatch.');
    }
  };

  const handleClearTodayDispatch = async () => {
    if (!currentUser?.id) {
      setStatus('No user id found. Please sign in again.');
      return;
    }

    try {
      console.log(`[NotificationTest] clearing today dispatch userId=${currentUser.id}`);
      const result = await clearTodayLearningReminderDispatch(currentUser.id);
      console.log('[NotificationTest] clear today dispatch response', result);
      setStatus(`Cleared today's reminder dispatch rows: ${result.deletedCount}.`);
    } catch (error) {
      console.error("[NotificationTest] Failed to clear today's reminder dispatch", error);
      setStatus("Failed to clear today's reminder dispatch.");
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ThemedText type="screenTitle">
          {t('settings.notificationTest.screenTitle', {
            defaultValue: 'Notification Test',
          })}
        </ThemedText>
        <ThemedText type="description">
          {t('settings.notificationTest.description', {
            defaultValue:
              'Use local checks for tray behavior and backend checks for Firebase Cloud Messaging delivery.',
          })}
        </ThemedText>
        <View style={styles.preferenceSummary}>
          <ThemedText type="bodyStrong">Learning reminder settings</ThemedText>
          <ThemedText type="description">
            {`Enabled: ${learningReminderEnabled ? 'yes' : 'no'} | Time: ${learningReminderTime}`}
          </ThemedText>
        </View>
        <OptionPickerField
          label="Local notification scenario"
          onSelect={(value) => setScenario(value as ScenarioOption)}
          options={[
            {
              description: 'Checks streak first and schedules locally only when today is not completed.',
              label: 'Smart check',
              value: 'smart-check',
            },
            {
              description: 'Always schedules a local notification for icon/tray testing.',
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

        <View style={styles.actionGroup}>
          <Button onPress={() => void handleSendTestNotification()}>
            {t('settings.notificationTest.sendButton', {
              defaultValue: 'Schedule local notification',
            })}
          </Button>
          <ThemedText type="description">
            Schedules a notification on this device only. It does not use Firebase or the backend.
          </ThemedText>
        </View>

        <View style={styles.actionGroup}>
          <Button onPress={() => void handleSetReminderToNextMinute()} variant="secondary">
            Set reminder to next minute
          </Button>
          <ThemedText type="description">
            Enables learning reminders and changes the reminder time to the next minute for quick
            dispatch testing.
          </ThemedText>
        </View>

        <View style={styles.actionGroup}>
          <Button onPress={() => void handleRefreshPushToken()} variant="secondary">
            Refresh/Register FCM token
          </Button>
          <ThemedText type="description">
            Gets the Android Firebase Cloud Messaging token and saves it on the backend for this
            user and device.
          </ThemedText>
        </View>

        <View style={styles.actionGroup}>
          <Button onPress={() => void handleSendRemoteTestPush()} variant="secondary">
            Send backend FCM push
          </Button>
          <ThemedText type="description">
            Sends an immediate test push from the backend through Firebase to the registered FCM
            token.
          </ThemedText>
        </View>

        <View style={styles.actionGroup}>
          <Button onPress={() => void handleDispatchLearningRemindersNow()} variant="secondary">
            Run backend reminder dispatch
          </Button>
          <ThemedText type="description">
            Runs the real reminder job now. It sends only when reminders are enabled, the selected
            time is in the dispatch window, today is not completed, and an active FCM token exists.
          </ThemedText>
        </View>

        <View style={styles.actionGroup}>
          <Button onPress={() => void handleClearTodayDispatch()} variant="secondary">
            Clear today's reminder dispatch
          </Button>
          <ThemedText type="description">
            Removes today's already-sent marker for this user so scheduled reminder delivery can be
            tested again on the same day.
          </ThemedText>
        </View>

        {status ? <ThemedText type="description">{status}</ThemedText> : null}
      </ScrollView>
    </ScreenContainer>
  );
}
