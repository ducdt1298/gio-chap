/**
 * Notification Provider — Giỗ Chạp
 * Platform-aware notifications: expo-notifications on native, Web Notifications API on web.
 */

import { Platform } from 'react-native';

// ===== Types =====

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  triggerDate: Date;
  data?: Record<string, unknown>;
}

// ===== Permission =====

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  // Native
  try {
    const Notifications = await import('expo-notifications');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Notifications not available:', error);
    return false;
  }
}

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined') return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return 'undetermined';
  }

  try {
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.getPermissionsAsync();
    return status as 'granted' | 'denied' | 'undetermined';
  } catch {
    return 'denied';
  }
}

// ===== Scheduling =====

/**
 * Schedule a local notification at a specific date/time.
 * On web: stores in localStorage and shows via Web Notifications API when time arrives.
 * On native: uses expo-notifications scheduler.
 */
export async function scheduleNotification(notification: ScheduledNotification): Promise<string | null> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.warn('Notification permission not granted');
    return null;
  }

  if (Platform.OS === 'web') {
    return scheduleWebNotification(notification);
  }

  return scheduleNativeNotification(notification);
}

// --- Web ---

function scheduleWebNotification(notification: ScheduledNotification): string {
  // Store the scheduled notification in localStorage
  const pendingKey = 'giochap_pending_notifications';
  const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]') as ScheduledNotification[];

  // Remove duplicate by id
  const filtered = pending.filter(n => n.id !== notification.id);
  filtered.push({
    ...notification,
    triggerDate: notification.triggerDate,
  });
  localStorage.setItem(pendingKey, JSON.stringify(filtered));

  // Set a timeout if the notification is within 24 hours
  const delay = notification.triggerDate.getTime() - Date.now();
  if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      showWebNotification(notification);
    }, delay);
  }

  return notification.id;
}

function showWebNotification(notification: ScheduledNotification): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  new Notification(notification.title, {
    body: notification.body,
    icon: '🙏',
    tag: notification.id,
  });

  // Remove from pending
  const pendingKey = 'giochap_pending_notifications';
  const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]') as ScheduledNotification[];
  localStorage.setItem(pendingKey, JSON.stringify(pending.filter(n => n.id !== notification.id)));
}

/**
 * Check and fire any pending web notifications that were due.
 * Should be called on app start for web.
 */
export async function checkPendingWebNotifications(): Promise<void> {
  if (Platform.OS !== 'web') return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  const pendingKey = 'giochap_pending_notifications';
  const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]') as ScheduledNotification[];
  const now = Date.now();

  const due = pending.filter(n => new Date(n.triggerDate).getTime() <= now);
  const remaining = pending.filter(n => new Date(n.triggerDate).getTime() > now);

  for (const n of due) {
    showWebNotification({ ...n, triggerDate: new Date(n.triggerDate) });
  }

  localStorage.setItem(pendingKey, JSON.stringify(remaining));

  // Schedule upcoming ones within 24h
  for (const n of remaining) {
    const delay = new Date(n.triggerDate).getTime() - now;
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        showWebNotification({ ...n, triggerDate: new Date(n.triggerDate) });
      }, delay);
    }
  }
}

// --- Native ---

async function scheduleNativeNotification(notification: ScheduledNotification): Promise<string | null> {
  try {
    const Notifications = await import('expo-notifications');

    // Cancel existing notification with same identifier
    try {
      await Notifications.cancelScheduledNotificationAsync(notification.id);
    } catch {}

    const id = await Notifications.scheduleNotificationAsync({
      identifier: notification.id,
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notification.triggerDate,
      },
    });

    return id;
  } catch (error) {
    console.error('Error scheduling native notification:', error);
    return null;
  }
}

// ===== Cancel =====

export async function cancelNotification(id: string): Promise<void> {
  if (Platform.OS === 'web') {
    const pendingKey = 'giochap_pending_notifications';
    const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]') as ScheduledNotification[];
    localStorage.setItem(pendingKey, JSON.stringify(pending.filter(n => n.id !== id)));
    return;
  }

  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (error) {
    console.warn('Error cancelling notification:', error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem('giochap_pending_notifications');
    return;
  }

  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Error cancelling all notifications:', error);
  }
}

// ===== Android Channel Setup =====

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    const Notifications = await import('expo-notifications');
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Nhắc nhở',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C8923C',
      description: 'Nhắc nhở ngày Giỗ, Rằm, Mùng 1',
    });
  } catch (error) {
    console.warn('Error setting up notification channel:', error);
  }
}
