/**
 * Journal CRUD — Giỗ Chạp Phase 2
 * Manages journal events and photos.
 * Platform: Native (SQLite)
 */

import { getDatabase, generateId } from './database';

// ===== Types =====

export interface JournalEventRow {
  id: string;
  title: string;
  event_type: string; // 'gio' | 'ram' | 'mung1' | 'tat_nien' | 'vu_lan' | 'custom'
  event_date_solar: string; // 'YYYY-MM-DD'
  event_date_lunar: string;
  ancestor_id: string | null;
  notes: string;
  total_expense: number;
  created_at: string;
  updated_at: string;
}

export interface JournalPhotoRow {
  id: string;
  event_id: string;
  photo_uri: string;
  caption: string;
  sort_order: number;
  created_at: string;
}

export const EVENT_TYPES: Record<string, { label: string; icon: string }> = {
  gio: { label: 'Cúng Giỗ', icon: '🕯️' },
  ram: { label: 'Cúng Rằm', icon: '🌕' },
  mung1: { label: 'Cúng Mùng 1', icon: '🌑' },
  tat_nien: { label: 'Tất Niên', icon: '🎆' },
  vu_lan: { label: 'Vu Lan', icon: '🪷' },
  custom: { label: 'Khác', icon: '📝' },
};

// ===== Journal Events =====

export async function getAllEvents(year?: number): Promise<JournalEventRow[]> {
  const db = await getDatabase();
  if (year) {
    return db.getAllAsync<JournalEventRow>(
      `SELECT * FROM journal_events WHERE event_date_solar LIKE ? ORDER BY event_date_solar DESC`,
      [`${year}-%`]
    );
  }
  return db.getAllAsync<JournalEventRow>(
    'SELECT * FROM journal_events ORDER BY event_date_solar DESC'
  );
}

export async function getEventById(id: string): Promise<JournalEventRow | null> {
  const db = await getDatabase();
  return db.getFirstAsync<JournalEventRow>(
    'SELECT * FROM journal_events WHERE id = ?', [id]
  );
}

export async function getEventsByAncestor(ancestorId: string): Promise<JournalEventRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<JournalEventRow>(
    'SELECT * FROM journal_events WHERE ancestor_id = ? ORDER BY event_date_solar DESC',
    [ancestorId]
  );
}

export async function insertEvent(event: Omit<JournalEventRow, 'created_at' | 'updated_at' | 'total_expense'>): Promise<string> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO journal_events (id, title, event_type, event_date_solar, event_date_lunar, ancestor_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [event.id, event.title, event.event_type, event.event_date_solar, event.event_date_lunar, event.ancestor_id, event.notes]
  );
  return event.id;
}

export async function updateEvent(event: Pick<JournalEventRow, 'id' | 'title' | 'event_type' | 'event_date_solar' | 'event_date_lunar' | 'ancestor_id' | 'notes'>): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE journal_events SET title=?, event_type=?, event_date_solar=?, event_date_lunar=?, ancestor_id=?, notes=?, updated_at=datetime('now') WHERE id=?`,
    [event.title, event.event_type, event.event_date_solar, event.event_date_lunar, event.ancestor_id, event.notes, event.id]
  );
}

export async function deleteEvent(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM journal_events WHERE id = ?', [id]);
}

export async function updateEventExpense(eventId: string): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(actual_price), 0) as total FROM shopping_items WHERE event_id = ?',
    [eventId]
  );
  await db.runAsync(
    'UPDATE journal_events SET total_expense = ?, updated_at = datetime(\'now\') WHERE id = ?',
    [row?.total ?? 0, eventId]
  );
}

// ===== Journal Photos =====

export async function getPhotosForEvent(eventId: string): Promise<JournalPhotoRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<JournalPhotoRow>(
    'SELECT * FROM journal_photos WHERE event_id = ? ORDER BY sort_order ASC, created_at ASC',
    [eventId]
  );
}

export async function addPhotoToEvent(eventId: string, photoUri: string, caption: string = ''): Promise<string> {
  const db = await getDatabase();
  const id = generateId();
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    'SELECT COALESCE(MAX(sort_order), 0) as m FROM journal_photos WHERE event_id = ?',
    [eventId]
  );
  await db.runAsync(
    'INSERT INTO journal_photos (id, event_id, photo_uri, caption, sort_order) VALUES (?, ?, ?, ?, ?)',
    [id, eventId, photoUri, caption, (maxOrder?.m ?? 0) + 1]
  );
  return id;
}

export async function removePhoto(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM journal_photos WHERE id = ?', [id]);
}

export async function getEventPhotoCount(eventId: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM journal_photos WHERE event_id = ?',
    [eventId]
  );
  return row?.count ?? 0;
}

export async function getFirstPhotoForEvent(eventId: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ photo_uri: string }>(
    'SELECT photo_uri FROM journal_photos WHERE event_id = ? ORDER BY sort_order ASC LIMIT 1',
    [eventId]
  );
  return row?.photo_uri ?? null;
}

export { generateId };
