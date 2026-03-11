/**
 * Database Layer — Native Implementation (iOS/Android)
 * Uses expo-sqlite for structured local storage.
 * 
 * NOTE: Web uses database.web.ts (selected automatically by Metro).
 */

import * as SQLite from 'expo-sqlite';

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

// ===== SQLite Database =====

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('giochap.db');
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS ancestors (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        family_rank TEXT NOT NULL DEFAULT '',
        death_day_lunar INTEGER NOT NULL,
        death_month_lunar INTEGER NOT NULL,
        death_year_lunar INTEGER NOT NULL,
        death_is_leap_month INTEGER NOT NULL DEFAULT 0,
        death_day_solar INTEGER NOT NULL,
        death_month_solar INTEGER NOT NULL,
        death_year_solar INTEGER NOT NULL,
        burial_place TEXT DEFAULT '',
        photo_uri TEXT,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        target_date TEXT NOT NULL,
        advance_days INTEGER NOT NULL DEFAULT 1,
        is_sent INTEGER NOT NULL DEFAULT 0,
        ancestor_id TEXT,
        FOREIGN KEY (ancestor_id) REFERENCES ancestors(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS prayers (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        content_template TEXT NOT NULL,
        is_custom INTEGER NOT NULL DEFAULT 0,
        description TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS journal_events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        event_type TEXT NOT NULL DEFAULT 'custom',
        event_date_solar TEXT NOT NULL,
        event_date_lunar TEXT DEFAULT '',
        ancestor_id TEXT,
        notes TEXT DEFAULT '',
        total_expense INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (ancestor_id) REFERENCES ancestors(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS journal_photos (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        photo_uri TEXT NOT NULL,
        caption TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (event_id) REFERENCES journal_events(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS shopping_items (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        name TEXT NOT NULL,
        quantity TEXT DEFAULT '',
        estimated_price INTEGER DEFAULT 0,
        actual_price INTEGER DEFAULT 0,
        is_checked INTEGER DEFAULT 0,
        category TEXT DEFAULT 'other',
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (event_id) REFERENCES journal_events(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        ingredients TEXT DEFAULT '',
        instructions TEXT DEFAULT '',
        serving_size TEXT DEFAULT '',
        prep_time TEXT DEFAULT '',
        event_types TEXT DEFAULT '',
        photo_uri TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }
  return db;
}

// --- Ancestors ---

export async function getAllAncestors(): Promise<AncestorRow[]> {
  const database = await getDatabase();
  return await database.getAllAsync<AncestorRow>(
    'SELECT * FROM ancestors ORDER BY death_month_lunar ASC, death_day_lunar ASC'
  );
}

export async function getAncestorById(id: string): Promise<AncestorRow | null> {
  const database = await getDatabase();
  return await database.getFirstAsync<AncestorRow>('SELECT * FROM ancestors WHERE id = ?', [id]);
}

export async function insertAncestor(ancestor: Omit<AncestorRow, 'created_at' | 'updated_at'>): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO ancestors (id, full_name, family_rank, death_day_lunar, death_month_lunar, death_year_lunar, death_is_leap_month, death_day_solar, death_month_solar, death_year_solar, burial_place, photo_uri, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ancestor.id, ancestor.full_name, ancestor.family_rank, ancestor.death_day_lunar, ancestor.death_month_lunar, ancestor.death_year_lunar, ancestor.death_is_leap_month, ancestor.death_day_solar, ancestor.death_month_solar, ancestor.death_year_solar, ancestor.burial_place, ancestor.photo_uri, ancestor.notes]
  );
}

export async function updateAncestor(ancestor: Omit<AncestorRow, 'created_at' | 'updated_at'>): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE ancestors SET full_name=?, family_rank=?, death_day_lunar=?, death_month_lunar=?, death_year_lunar=?, death_is_leap_month=?, death_day_solar=?, death_month_solar=?, death_year_solar=?, burial_place=?, photo_uri=?, notes=?, updated_at=datetime('now') WHERE id=?`,
    [ancestor.full_name, ancestor.family_rank, ancestor.death_day_lunar, ancestor.death_month_lunar, ancestor.death_year_lunar, ancestor.death_is_leap_month, ancestor.death_day_solar, ancestor.death_month_solar, ancestor.death_year_solar, ancestor.burial_place, ancestor.photo_uri, ancestor.notes, ancestor.id]
  );
}

export async function deleteAncestor(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM ancestors WHERE id = ?', [id]);
}

// --- Prayers ---

export async function getAllPrayers(): Promise<PrayerRow[]> {
  const database = await getDatabase();
  return await database.getAllAsync<PrayerRow>('SELECT * FROM prayers ORDER BY category ASC, title ASC');
}

export async function getPrayersByCategory(category: string): Promise<PrayerRow[]> {
  const database = await getDatabase();
  return await database.getAllAsync<PrayerRow>('SELECT * FROM prayers WHERE category = ? ORDER BY title ASC', [category]);
}

export async function getPrayerById(id: string): Promise<PrayerRow | null> {
  const database = await getDatabase();
  return await database.getFirstAsync<PrayerRow>('SELECT * FROM prayers WHERE id = ?', [id]);
}

export async function insertPrayer(prayer: PrayerRow): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO prayers (id, title, category, content_template, is_custom, description) VALUES (?, ?, ?, ?, ?, ?)`,
    [prayer.id, prayer.title, prayer.category, prayer.content_template, prayer.is_custom, prayer.description]
  );
}

export async function deletePrayer(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM prayers WHERE id = ?', [id]);
}

// --- Settings ---

export async function getSetting(key: string): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

// --- Seed ---

export async function seedDefaultPrayers(): Promise<void> {
  const database = await getDatabase();
  const existing = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM prayers WHERE is_custom = 0');
  if (existing && existing.count > 0) return;
  const { DEFAULT_PRAYERS } = await import('@/constants/prayers');
  for (const prayer of DEFAULT_PRAYERS) {
    await insertPrayer(prayer);
  }
}
