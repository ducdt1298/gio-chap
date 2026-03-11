/**
 * Database Layer — Web Implementation
 * Uses localStorage for offline data persistence on web.
 */

// ===== Generic ID Generator =====

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// ===== Row Types =====

export interface AncestorRow {
  id: string;
  full_name: string;
  family_rank: string;
  death_day_lunar: number;
  death_month_lunar: number;
  death_year_lunar: number;
  death_is_leap_month: number;
  death_day_solar: number;
  death_month_solar: number;
  death_year_solar: number;
  burial_place: string;
  photo_uri: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PrayerRow {
  id: string;
  title: string;
  category: string;
  content_template: string;
  is_custom: number;
  description: string;
}

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

// ===== Public API =====

export async function getDatabase(): Promise<void> {
  // No-op on web
}

// --- Ancestors ---

export async function getAllAncestors(): Promise<AncestorRow[]> {
  return getStore<AncestorRow>('ancestors').sort((a, b) =>
    a.death_month_lunar - b.death_month_lunar || a.death_day_lunar - b.death_day_lunar
  );
}

export async function getAncestorById(id: string): Promise<AncestorRow | null> {
  return getStore<AncestorRow>('ancestors').find(a => a.id === id) || null;
}

export async function insertAncestor(ancestor: Omit<AncestorRow, 'created_at' | 'updated_at'>): Promise<void> {
  const all = getStore<AncestorRow>('ancestors');
  const now = new Date().toISOString();
  all.push({ ...ancestor, created_at: now, updated_at: now } as AncestorRow);
  setStore('ancestors', all);
}

export async function updateAncestor(ancestor: Omit<AncestorRow, 'created_at' | 'updated_at'>): Promise<void> {
  const all = getStore<AncestorRow>('ancestors');
  const idx = all.findIndex(a => a.id === ancestor.id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...ancestor, updated_at: new Date().toISOString() };
    setStore('ancestors', all);
  }
}

export async function deleteAncestor(id: string): Promise<void> {
  setStore('ancestors', getStore<AncestorRow>('ancestors').filter(a => a.id !== id));
}

// --- Prayers ---

export async function getAllPrayers(): Promise<PrayerRow[]> {
  return getStore<PrayerRow>('prayers').sort((a, b) =>
    a.category.localeCompare(b.category) || a.title.localeCompare(b.title)
  );
}

export async function getPrayersByCategory(category: string): Promise<PrayerRow[]> {
  return getStore<PrayerRow>('prayers').filter(p => p.category === category);
}

export async function getPrayerById(id: string): Promise<PrayerRow | null> {
  return getStore<PrayerRow>('prayers').find(p => p.id === id) || null;
}

export async function insertPrayer(prayer: PrayerRow): Promise<void> {
  const all = getStore<PrayerRow>('prayers');
  const idx = all.findIndex(p => p.id === prayer.id);
  if (idx !== -1) {
    all[idx] = prayer;
  } else {
    all.push(prayer);
  }
  setStore('prayers', all);
}

export async function deletePrayer(id: string): Promise<void> {
  setStore('prayers', getStore<PrayerRow>('prayers').filter(p => p.id !== id));
}

// --- Settings ---

export async function getSetting(key: string): Promise<string | null> {
  try {
    return localStorage.getItem(`giochap_setting_${key}`);
  } catch {
    return null;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  localStorage.setItem(`giochap_setting_${key}`, value);
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('giochap_setting_')) {
        result[k.replace('giochap_setting_', '')] = localStorage.getItem(k) || '';
      }
    }
  } catch {}
  return result;
}

// --- Seed ---

export async function seedDefaultPrayers(): Promise<void> {
  const existing = getStore<PrayerRow>('prayers');
  if (existing.some(p => p.is_custom === 0)) return;
  const { DEFAULT_PRAYERS } = await import('@/constants/prayers');
  for (const prayer of DEFAULT_PRAYERS) {
    await insertPrayer(prayer);
  }
}
