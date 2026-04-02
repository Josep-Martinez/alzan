import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from '../i18n';
import { MealReminder } from '../hooks/settings/useSettingsNotifications';
import { MealType } from '../types/requests.types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationService = {
  async registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    return finalStatus;
  },

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async cancelNotification(identifier: string) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  },

  async scheduleDailyNotification(
    id: string,
    title: string,
    body: string,
    hour: number,
    minute: number,
    categoryUrl?: string,
  ) {
    try {
      // Cancel existing if any with same ID (not directly supported by expo by ID, but we can manage it)
      // Actually expo doesn't let us query by our own ID easily unless we store the ID returned by schedule
      // For simplicity in this logic, we rely on the caller to cancel or we just schedule.
      // A better approach for "settings sync" is to cancel all associated with a category and reschedule.

      // However, since we don't persist notification IDs in DB, a common strategy for local notifications settings
      // is to "Cancel All related to this feature" then "Schedule new".
      // Since we can't easily filter by "feature", we might relying on pure rescheduling.
      // BUT: Expo allows passing an `identifier` in the simplified API? No, checks docs.
      // Documentation says: returns Promise<string> (notificationId).

      // WORKAROUND: We can't easily "upsert" a notification by a custom ID in Expo Local Notifications without tracking IDs.
      // STRATEGY: We will assume the application simply re-schedules everything when settings change.
      // OR: We will modify this to return the ID and let the hook manage it.
      //
      // Revised Strategy for MVP:
      // When updating settings, we will first `cancelAllScheduledNotificationsAsync` and then re-schedule ALL active settings.
      // This is the most robust way to ensure we don't have zombie notifications without complex ID tracking.

      const trigger: Notifications.CalendarTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { url: categoryUrl },
        },
        trigger,
      });
      console.log(`Scheduled: ${title} at ${hour}:${minute}`);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  },

  async scheduleWeeklyNotification(
    id: string,
    title: string,
    body: string,
    hour: number,
    minute: number,
    weekday: number, // 1=Sunday, 2=Monday, ... 7=Saturday
    categoryUrl?: string,
  ) {
    try {
      const trigger: Notifications.CalendarTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        weekday,
        repeats: true,
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { url: categoryUrl },
        },
        trigger,
      });
      console.log(`Scheduled weekly: ${title} at ${hour}:${minute} on day ${weekday}`);
    } catch (error) {
      console.error('Error scheduling weekly notification:', error);
    }
  },

  // Specific Schedulers
  async scheduleTrainingReminder(timeStr: string) {
    const [hour, minute] = timeStr.split(':').map(Number);
    await this.scheduleDailyNotification(
      'training_reminder',
      i18n.t('notifications.training.reminder.title'),
      i18n.t('notifications.training.reminder.body'),
      hour,
      minute,
    );
  },

  async scheduleInactivityReminder(days: number = 3) {
    try {
      // Cancel any existing inactivity reminder first
      await Notifications.cancelScheduledNotificationAsync('inactivity_reminder').catch(() => {});

      // Schedule notification for X days from now
      const triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + days);
      triggerDate.setHours(10, 0, 0, 0); // 10:00 AM

      await Notifications.scheduleNotificationAsync({
        identifier: 'inactivity_reminder',
        content: {
          title: i18n.t('notifications.training.inactivity.title'),
          body: i18n.t('notifications.training.inactivity.body'),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
      console.log(`Inactivity reminder scheduled for ${triggerDate.toISOString()}`);
    } catch (error) {
      console.error('Error scheduling inactivity reminder:', error);
    }
  },

  async cancelInactivityReminder() {
    try {
      await Notifications.cancelScheduledNotificationAsync('inactivity_reminder');
    } catch {
      // Ignore if not found
    }
  },

  async scheduleMealReminder(meal: MealType, settings: MealReminder) {
    if (!settings.enabled) return;
    const [hour, minute] = settings.time.split(':').map(Number);
    const title = i18n.t(`notifications.meals.${meal}.title`);
    const body = i18n.t(`notifications.meals.${meal}.body`);

    await this.scheduleDailyNotification(`meal_${meal}`, title, body, hour, minute);
  },

  async scheduleHealthReminder(
    type: 'weight' | 'sleep' | 'hydration',
    timeStr: string,
    enabled: boolean,
    days: number[] = [], // Array of 0-6 (0=Sunday)
  ) {
    if (!enabled) return;
    const [hour, minute] = timeStr.split(':').map(Number);
    const title = i18n.t(`notifications.health.${type}.title`);
    const body = i18n.t(`notifications.health.${type}.body`);

    if (days.length > 0) {
      // Schedule for specific days
      for (const day of days) {
        // Map 0-6 (Sun-Sat) to Expo 1-7 (Sun-Sat)
        // In JS getDay(): 0=Sun, 1=Mon...
        // In Expo: 1=Sun, 2=Mon...
        // So simply day + 1
        const expoWeekday = day + 1;

        await this.scheduleWeeklyNotification(`health_${type}_${day}`, title, body, hour, minute, expoWeekday);
      }
    } else {
      // Default to daily if no days specified (or empty) but enabled?
      // Existing logic fallback: if it's 'weight', we usually expect days.
      // If it's sleep/hydration likely they don't have day selectors yet so we keep daily.
      await this.scheduleDailyNotification(`health_${type}`, title, body, hour, minute);
    }
  },
};
