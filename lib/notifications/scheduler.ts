/**
 * Reminder Scheduler — Giỗ Chạp
 * Schedules notifications for:
 * - Rằm (15th lunar) & Mùng 1 (1st lunar) — recurring monthly
 * - Death anniversaries — configurable advance days (1, 3, 7)
 */

import { getAllAncestors, getSetting, type AncestorRow } from '@/lib/db/database';
import {
  getNextAnniversarySolar,
  getRamMung1InYear,
  dateToLunar,
  getLunarMonthName,
} from '@/lib/lunar/converter';
import {
  scheduleNotification,
  cancelAllNotifications,
  checkPendingWebNotifications,
  setupNotificationChannel,
  requestNotificationPermission,
  getNotificationPermissionStatus,
  type ScheduledNotification,
} from './provider';

// ===== Public API =====

/**
 * Initialize the reminder system.
 * Should be called on app startup.
 */
export async function initReminders(): Promise<void> {
  // Setup Android notification channel
  await setupNotificationChannel();

  // Check pending web notifications
  await checkPendingWebNotifications();
}

/**
 * Recalculate and reschedule all reminders.
 * Call this when:
 * - App starts (on foreground)
 * - An ancestor is added/updated/deleted
 * - Settings change
 */
export async function recalculateAllReminders(): Promise<{ scheduled: number; errors: number }> {
  const permissionStatus = await getNotificationPermissionStatus();
  if (permissionStatus !== 'granted') {
    return { scheduled: 0, errors: 0 };
  }

  // Cancel all existing scheduled notifications
  await cancelAllNotifications();

  let scheduled = 0;
  let errors = 0;

  try {
    // 1. Schedule Rằm & Mùng 1 reminders
    const ramMungCount = await scheduleRamMung1();
    scheduled += ramMungCount;

    // 2. Schedule death anniversary reminders
    const ancestorCount = await scheduleAllAnniversaries();
    scheduled += ancestorCount;
  } catch (error) {
    console.error('Error recalculating reminders:', error);
    errors++;
  }

  console.log(`[Reminders] Scheduled ${scheduled} notifications`);
  return { scheduled, errors };
}

// ===== Rằm & Mùng 1 =====

/**
 * Schedule reminders for upcoming Rằm (15th) and Mùng 1 (1st) dates.
 * Schedules 1 day in advance at 8:00 AM.
 */
async function scheduleRamMung1(): Promise<number> {
  const today = new Date();
  const year = today.getFullYear();
  let count = 0;

  // Get Rằm/Mùng 1 dates for current year
  const dates = getRamMung1InYear(year);

  for (const entry of dates) {
    const eventDate = new Date(entry.solar.year, entry.solar.month - 1, entry.solar.day);

    // Only schedule future dates
    if (eventDate <= today) continue;

    // Schedule 1 day before at 8:00 AM
    const triggerDate = new Date(eventDate);
    triggerDate.setDate(triggerDate.getDate() - 1);
    triggerDate.setHours(8, 0, 0, 0);

    // Skip if trigger date is in the past
    if (triggerDate <= today) continue;

    const monthName = getLunarMonthName(entry.lunar.month);
    const isRam = entry.type === 'ram';
    const eventName = isRam ? `Rằm ${monthName}` : `Mùng 1 ${monthName}`;

    const notification: ScheduledNotification = {
      id: `rammung1_${entry.type}_${entry.lunar.month}_${year}`,
      title: isRam ? '🌕 Ngày mai là Rằm' : '🌑 Ngày mai là Mùng 1',
      body: `${eventName} — nhớ chuẩn bị lễ cúng nhé!`,
      triggerDate,
      data: {
        type: 'ram_mung1',
        eventType: entry.type,
        lunarMonth: entry.lunar.month,
      },
    };

    const result = await scheduleNotification(notification);
    if (result) count++;
  }

  return count;
}

// ===== Death Anniversaries =====

/**
 * Schedule reminders for all ancestor death anniversaries.
 * Uses the advance days setting from user preferences.
 */
async function scheduleAllAnniversaries(): Promise<number> {
  const ancestors = await getAllAncestors();
  const advanceDaysSetting = await getSetting('reminderAdvanceDays');
  const advanceDays = parseInt(advanceDaysSetting || '3', 10);

  let count = 0;

  for (const ancestor of ancestors) {
    const result = await scheduleAncestorReminders(ancestor, advanceDays);
    count += result;
  }

  return count;
}

/**
 * Schedule reminders for a single ancestor's death anniversary.
 */
async function scheduleAncestorReminders(
  ancestor: AncestorRow,
  advanceDays: number
): Promise<number> {
  const today = new Date();
  let count = 0;

  // Get next anniversary solar date
  const nextSolar = getNextAnniversarySolar(
    ancestor.death_day_lunar,
    ancestor.death_month_lunar,
    today
  );

  const anniversaryDate = new Date(nextSolar.year, nextSolar.month - 1, nextSolar.day);

  // Skip if already past
  if (anniversaryDate <= today) return 0;

  const yearsSinceDeath = today.getFullYear() - ancestor.death_year_solar;
  let gioType = 'Giỗ thường';
  if (yearsSinceDeath <= 1) gioType = 'Giỗ đầu';
  else if (yearsSinceDeath <= 2) gioType = 'Giỗ hết';

  const monthName = getLunarMonthName(ancestor.death_month_lunar);
  const fullLabel = `${ancestor.family_rank} ${ancestor.full_name}`;

  // Schedule advance reminder (X days before)
  if (advanceDays > 0) {
    const advanceTrigger = new Date(anniversaryDate);
    advanceTrigger.setDate(advanceTrigger.getDate() - advanceDays);
    advanceTrigger.setHours(8, 0, 0, 0);

    if (advanceTrigger > today) {
      const result = await scheduleNotification({
        id: `gio_advance_${ancestor.id}_${nextSolar.year}`,
        title: `🕯️ Còn ${advanceDays} ngày nữa là ngày Giỗ`,
        body: `${gioType} ${fullLabel} — ${ancestor.death_day_lunar}/${ancestor.death_month_lunar} (ÂL). Hãy chuẩn bị lễ vật!`,
        triggerDate: advanceTrigger,
        data: {
          type: 'anniversary_advance',
          ancestorId: ancestor.id,
          advanceDays,
        },
      });
      if (result) count++;
    }
  }

  // Schedule day-before reminder (Lễ Tiên Thường — typically the day before Giỗ)
  const dayBeforeTrigger = new Date(anniversaryDate);
  dayBeforeTrigger.setDate(dayBeforeTrigger.getDate() - 1);
  dayBeforeTrigger.setHours(7, 0, 0, 0);

  if (dayBeforeTrigger > today) {
    const result = await scheduleNotification({
      id: `gio_tienthuong_${ancestor.id}_${nextSolar.year}`,
      title: `🙏 Ngày mai là ${gioType}`,
      body: `${gioType} ${fullLabel} — hôm nay làm Lễ Tiên Thường (cúng trước 1 ngày).`,
      triggerDate: dayBeforeTrigger,
      data: {
        type: 'anniversary_eve',
        ancestorId: ancestor.id,
      },
    });
    if (result) count++;
  }

  // Schedule day-of reminder
  const dayOfTrigger = new Date(anniversaryDate);
  dayOfTrigger.setHours(6, 0, 0, 0);

  if (dayOfTrigger > today) {
    const result = await scheduleNotification({
      id: `gio_dayof_${ancestor.id}_${nextSolar.year}`,
      title: `🕯️ Hôm nay là ${gioType}`,
      body: `${gioType} ${fullLabel} — Ngày ${ancestor.death_day_lunar} ${monthName} (ÂL). Thành tâm dâng lễ!`,
      triggerDate: dayOfTrigger,
      data: {
        type: 'anniversary_today',
        ancestorId: ancestor.id,
      },
    });
    if (result) count++;
  }

  return count;
}

// ===== Utility =====

/**
 * Get a human-readable summary of upcoming reminders.
 */
export async function getReminderSummary(): Promise<string> {
  const ancestors = await getAllAncestors();
  const today = new Date();
  const year = today.getFullYear();

  const ramMungs = getRamMung1InYear(year).filter(d => {
    const eventDate = new Date(d.solar.year, d.solar.month - 1, d.solar.day);
    return eventDate > today;
  });

  const upcomingAnniversaries = ancestors.map(a => {
    const next = getNextAnniversarySolar(a.death_day_lunar, a.death_month_lunar, today);
    const nextDate = new Date(next.year, next.month - 1, next.day);
    const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { ancestor: a, nextDate, daysUntil };
  }).filter(a => a.daysUntil > 0).sort((a, b) => a.daysUntil - b.daysUntil);

  let summary = `📅 ${ramMungs.length} ngày Rằm/Mùng 1 còn lại trong năm ${year}\n`;
  summary += `🕯️ ${upcomingAnniversaries.length} ngày Giỗ sắp tới`;

  if (upcomingAnniversaries.length > 0) {
    const next = upcomingAnniversaries[0];
    summary += ` (gần nhất: ${next.ancestor.family_rank} ${next.ancestor.full_name} — ${next.daysUntil} ngày)`;
  }

  return summary;
}
