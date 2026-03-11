// ===== Lunar Calendar Types =====

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  isLeapMonth: boolean;
  julianDay: number;
}

export interface SolarDate {
  day: number;
  month: number;
  year: number;
}

export interface DayInfo {
  solar: SolarDate;
  lunar: LunarDate;
  canChi: string; // Heavenly Stem + Earthly Branch
  isGoodDay: boolean;
  hoangDao: string[]; // Auspicious hours
  description: string;
}

// ===== Ancestor Types =====

export type GioType = 'gio_dau' | 'gio_het' | 'gio_thuong';

export interface Ancestor {
  id: string;
  fullName: string;
  familyRank: string; // Ông, Bà, Cha, Mẹ, etc.
  deathDateLunar: LunarDate;
  deathDateSolar: SolarDate;
  burialPlace: string;
  photoUri: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Anniversary {
  id: string;
  ancestorId: string;
  ancestorName: string;
  type: GioType;
  lunarDay: number;
  lunarMonth: number;
  nextSolarDate: string; // ISO date string
  daysUntil: number;
}

// ===== Reminder Types =====

export type ReminderEventType = 'ram' | 'mung1' | 'gio' | 'custom';

export interface Reminder {
  id: string;
  eventType: ReminderEventType;
  title: string;
  description: string;
  targetDate: string; // ISO date string
  advanceDays: number;
  isSent: boolean;
  ancestorId: string | null;
}

// ===== Prayer Types =====

export type PrayerCategory =
  | 'ram_mung1'
  | 'gio'
  | 'tat_nien'
  | 'giao_thua'
  | 'le_chua'
  | 'mung_1_tet'
  | 'vu_lan'
  | 'custom';

export interface Prayer {
  id: string;
  title: string;
  category: PrayerCategory;
  contentTemplate: string; // with {{PLACEHOLDER}} markers
  isCustom: boolean;
  description: string;
}

// ===== Settings Types =====

export interface UserSettings {
  homeownerName: string;
  homeAddress: string;
  reminderAdvanceDays: number;
  themeMode: 'light' | 'dark' | 'system';
}

// ===== Navigation Types =====

export type RootTabParamList = {
  index: undefined;
  calendar: undefined;
  ancestors: undefined;
  prayers: undefined;
};
