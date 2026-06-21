import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import type { CalendarEvent } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'NNCリマインダー',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleEventNotifications(event: CalendarEvent): Promise<void> {
  const scheduledDate = new Date(event.scheduled_at);
  const now = new Date();

  if (event.notif_day_before) {
    const dayBefore = new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000);
    if (dayBefore > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 NNC リマインダー',
          body: `明日「${event.title}」があります`,
          data: { eventId: event.event_id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayBefore },
      });
    }
  }

  if (event.notif_one_hour) {
    const oneHourBefore = new Date(scheduledDate.getTime() - 60 * 60 * 1000);
    if (oneHourBefore > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 NNC リマインダー',
          body: `1時間後に「${event.title}」があります${event.contamination_points > 0 ? ` (行くと+${event.contamination_points}pt)` : ''}`,
          data: { eventId: event.event_id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: oneHourBefore },
      });
    }
  }

  if (event.notif_followup) {
    const nextDay = new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000);
    nextDay.setHours(9, 0, 0, 0);
    if (nextDay > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 NNC フォローアップ',
          body: `昨日の「${event.title}」はどうでしたか？`,
          data: { eventId: event.event_id, isFollowup: true },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nextDay },
      });
    }
  }
}

export function usePushNotifications() {
  useEffect(() => {
    requestNotificationPermission().catch(() => {});
  }, []);
}
