/**
 * Journal CRUD — Web Implementation
 * Uses localStorage for journal events and photos.
 */

import { generateId } from './database';

// ===== Types =====

export interface JournalEventRow {
  id: string;
  title: string;
  event_type: string;
  event_date_solar: string;
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

// ===== Helpers =====

function getStore<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(`giochap_${key}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStore<T>(key: string, data: T[]): void {
  localStorage.setItem(`giochap_${key}`, JSON.stringify(data));
}

// ===== Journal Events =====

export async function getAllEvents(year?: number): Promise<JournalEventRow[]> {
  let events = getStore<JournalEventRow>('journal_events');
  if (year) {
    events = events.filter(e => e.event_date_solar.startsWith(`${year}-`));
  }
  return events.sort((a, b) => b.event_date_solar.localeCompare(a.event_date_solar));
}

export async function getEventById(id: string): Promise<JournalEventRow | null> {
  return getStore<JournalEventRow>('journal_events').find(e => e.id === id) || null;
}

export async function getEventsByAncestor(ancestorId: string): Promise<JournalEventRow[]> {
  return getStore<JournalEventRow>('journal_events')
    .filter(e => e.ancestor_id === ancestorId)
    .sort((a, b) => b.event_date_solar.localeCompare(a.event_date_solar));
}

export async function insertEvent(event: Omit<JournalEventRow, 'created_at' | 'updated_at' | 'total_expense'>): Promise<string> {
  const all = getStore<JournalEventRow>('journal_events');
  const now = new Date().toISOString();
  all.push({ ...event, total_expense: 0, created_at: now, updated_at: now });
  setStore('journal_events', all);
  return event.id;
}

export async function updateEvent(event: Pick<JournalEventRow, 'id' | 'title' | 'event_type' | 'event_date_solar' | 'event_date_lunar' | 'ancestor_id' | 'notes'>): Promise<void> {
  const all = getStore<JournalEventRow>('journal_events');
  const idx = all.findIndex(e => e.id === event.id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...event, updated_at: new Date().toISOString() };
    setStore('journal_events', all);
  }
}

export async function deleteEvent(id: string): Promise<void> {
  setStore('journal_events', getStore<JournalEventRow>('journal_events').filter(e => e.id !== id));
  // Also delete associated photos
  setStore('journal_photos', getStore<JournalPhotoRow>('journal_photos').filter(p => p.event_id !== id));
}

export async function updateEventExpense(eventId: string): Promise<void> {
  const items = getStore<any>('shopping_items').filter((i: any) => i.event_id === eventId);
  const total = items.reduce((sum: number, i: any) => sum + (i.actual_price || 0), 0);
  const all = getStore<JournalEventRow>('journal_events');
  const idx = all.findIndex(e => e.id === eventId);
  if (idx !== -1) {
    all[idx].total_expense = total;
    all[idx].updated_at = new Date().toISOString();
    setStore('journal_events', all);
  }
}

// ===== Journal Photos =====

export async function getPhotosForEvent(eventId: string): Promise<JournalPhotoRow[]> {
  return getStore<JournalPhotoRow>('journal_photos')
    .filter(p => p.event_id === eventId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function addPhotoToEvent(eventId: string, photoUri: string, caption: string = ''): Promise<string> {
  const all = getStore<JournalPhotoRow>('journal_photos');
  const eventPhotos = all.filter(p => p.event_id === eventId);
  const maxOrder = eventPhotos.length > 0 ? Math.max(...eventPhotos.map(p => p.sort_order)) : 0;
  const id = generateId();
  all.push({
    id,
    event_id: eventId,
    photo_uri: photoUri,
    caption,
    sort_order: maxOrder + 1,
    created_at: new Date().toISOString(),
  });
  setStore('journal_photos', all);
  return id;
}

export async function removePhoto(id: string): Promise<void> {
  setStore('journal_photos', getStore<JournalPhotoRow>('journal_photos').filter(p => p.id !== id));
}

export async function getEventPhotoCount(eventId: string): Promise<number> {
  return getStore<JournalPhotoRow>('journal_photos').filter(p => p.event_id === eventId).length;
}

export async function getFirstPhotoForEvent(eventId: string): Promise<string | null> {
  const photos = getStore<JournalPhotoRow>('journal_photos')
    .filter(p => p.event_id === eventId)
    .sort((a, b) => a.sort_order - b.sort_order);
  return photos.length > 0 ? photos[0].photo_uri : null;
}

export { generateId };
