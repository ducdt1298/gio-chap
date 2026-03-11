/**
 * Vietnamese Lunar Calendar Engine
 * Based on Hồ Ngọc Đức's algorithm for accurate Vietnam-timezone lunar calendar.
 * Reference: https://www.informatik.uni-leipzig.de/~duc/amlich/
 *
 * All calculations use Vietnam timezone (UTC+7).
 */

import type { LunarDate, SolarDate } from '@/types';

const PI = Math.PI;
const TIMEZONE_OFFSET = 7.0; // Vietnam UTC+7

// ===== Julian Day Number Calculations =====

/**
 * Convert a Solar (Gregorian) date to Julian Day Number
 */
export function solarToJulianDay(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

/**
 * Convert Julian Day Number back to Solar (Gregorian) date
 */
export function julianDayToSolar(jd: number): SolarDate {
  let a: number, b: number, c: number;
  if (jd > 2299160) {
    a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = b * 100 + d - 4800 + Math.floor(m / 10);
  return { day, month, year };
}

// ===== Astronomical Calculations =====

/**
 * Compute the time of the k-th new moon after the new moon of Jan 1900 13:51 GMT.
 * Returns the time as Julian Day Number.
 */
function newMoon(k: number): number {
  const T = k / 1236.85; // Time in Julian centuries from 1900 Jan 0.5
  const T2 = T * T;
  const T3 = T2 * T;
  let dr = PI / 180;

  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);

  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;

  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));

  let deltaT: number;
  if (T < -11) {
    deltaT = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  } else {
    deltaT = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }

  const JdNew = Jd1 + C1 - deltaT;
  return JdNew;
}

/**
 * Compute the longitude of the sun at a given Julian Day Number.
 * Returns the sun longitude in degrees.
 */
function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525; // Time in Julian centuries from 2000 Jan 1.5
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  // Normalize to [0, 360)
  L = L - 360 * Math.floor(L / 360);
  return L;
}

/**
 * Compute the sun longitude at the given Julian Day Number,
 * Adjusted for Vietnam timezone (UTC+7).
 */
function sunLongitudeAA98(jdn: number): number {
  return sunLongitude(jdn - 0.5 + TIMEZONE_OFFSET / 24);
}

/**
 * Get the sun segment (major solar term index) for the given Julian Day Number.
 * Returns an integer from 0 to 11.
 */
function getSunLongitude(dayNumber: number): number {
  return Math.floor(sunLongitudeAA98(dayNumber) / 30);
}

/**
 * Get the new moon day (Julian Day Number) for the k-th new moon.
 * Adjusted for Vietnam timezone.
 */
function getNewMoonDay(k: number): number {
  const jd = newMoon(k);
  return Math.floor(jd + 0.5 + TIMEZONE_OFFSET / 24);
}

/**
 * Get the lunar month 11 start day (Julian Day Number) for a given year.
 */
function getLunarMonth11(yy: number): number {
  const off = solarToJulianDay(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k);
  const sunLong = getSunLongitude(nm);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1);
  }
  return nm;
}

/**
 * Determine the leap month offset for a lunar year starting from lunar month 11.
 */
function getLeapMonthOffset(a11: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last: number;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i));
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i));
  } while (arc !== last && i < 14);
  return i - 1;
}

// ===== Public API =====

/**
 * Convert a Solar (Gregorian) date to Vietnamese Lunar date.
 */
export function solarToLunar(dd: number, mm: number, yy: number): LunarDate {
  const dayNumber = solarToJulianDay(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k - 1);
  }
  let a11 = getLunarMonth11(yy);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let lunarLeap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        lunarLeap = true;
      }
    }
  }
  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }
  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    isLeapMonth: lunarLeap,
    julianDay: dayNumber,
  };
}

/**
 * Convert a Vietnamese Lunar date to Solar (Gregorian) date.
 */
export function lunarToSolar(lunarDay: number, lunarMonth: number, lunarYear: number, lunarLeap: boolean = false): SolarDate {
  let a11: number, b11: number;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1);
    b11 = getLunarMonth11(lunarYear);
  } else {
    a11 = getLunarMonth11(lunarYear);
    b11 = getLunarMonth11(lunarYear + 1);
  }
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) {
    off += 12;
  }
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) {
      leapMonth += 12;
    }
    if (lunarLeap && lunarMonth !== leapMonth) {
      return { day: 0, month: 0, year: 0 }; // Invalid
    } else if (lunarLeap || (off >= leapOff)) {
      off += 1;
    }
  }
  const monthStart = getNewMoonDay(k + off);
  return julianDayToSolar(monthStart + lunarDay - 1);
}

/**
 * Convenience: Convert a Date object to LunarDate
 */
export function dateToLunar(date: Date): LunarDate {
  return solarToLunar(date.getDate(), date.getMonth() + 1, date.getFullYear());
}

/**
 * Convenience: Convert LunarDate to a Date object
 */
export function lunarToDate(lunar: LunarDate): Date {
  const solar = lunarToSolar(lunar.day, lunar.month, lunar.year, lunar.isLeapMonth);
  return new Date(solar.year, solar.month - 1, solar.day);
}

// ===== Can Chi (Heavenly Stems & Earthly Branches) =====

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

/**
 * Get Can Chi for a year
 */
export function getYearCanChi(year: number): string {
  return `${CAN[(year + 6) % 10]} ${CHI[(year + 8) % 12]}`;
}

/**
 * Get Can Chi for a day (based on Julian Day Number)
 */
export function getDayCanChi(jd: number): string {
  return `${CAN[(jd + 9) % 10]} ${CHI[(jd + 1) % 12]}`;
}

/**
 * Get Can Chi for a month
 */
export function getMonthCanChi(month: number, year: number): string {
  const canIndex = (year * 12 + month + 3) % 10;
  const chiIndex = (month + 1) % 12;
  return `${CAN[canIndex]} ${CHI[chiIndex]}`;
}

// ===== Hoàng Đạo (Auspicious Hours) =====

const GIO_HOANG_DAO: Record<number, number[]> = {
  0: [0, 1, 3, 6, 7, 9],      // Tý day
  1: [1, 2, 4, 7, 8, 10],     // Sửu day
  2: [0, 2, 3, 5, 8, 9],      // Dần day
  3: [1, 3, 4, 6, 9, 10],     // Mão day
  4: [0, 2, 4, 5, 7, 10],     // Thìn day
  5: [1, 3, 5, 6, 8, 11],     // Tỵ day
  6: [0, 1, 3, 6, 7, 9],      // Ngọ day (same as Tý)
  7: [1, 2, 4, 7, 8, 10],     // Mùi day
  8: [0, 2, 3, 5, 8, 9],      // Thân day
  9: [1, 3, 4, 6, 9, 10],     // Dậu day
  10: [0, 2, 4, 5, 7, 10],    // Tuất day
  11: [1, 3, 5, 6, 8, 11],    // Hợi day
};

const GIO_LABEL = [
  'Tý (23h-1h)', 'Sửu (1h-3h)', 'Dần (3h-5h)',
  'Mão (5h-7h)', 'Thìn (7h-9h)', 'Tỵ (9h-11h)',
  'Ngọ (11h-13h)', 'Mùi (13h-15h)', 'Thân (15h-17h)',
  'Dậu (17h-19h)', 'Tuất (19h-21h)', 'Hợi (21h-23h)',
];

/**
 * Get auspicious hours for a given Julian Day Number
 */
export function getHoangDao(jd: number): string[] {
  const chiIndex = (jd + 1) % 12;
  const indices = GIO_HOANG_DAO[chiIndex] || [];
  return indices.map(i => GIO_LABEL[i]);
}

// ===== Lunar Month Names =====

const LUNAR_MONTH_NAMES = [
  '', 'Tháng Giêng', 'Tháng Hai', 'Tháng Ba',
  'Tháng Tư', 'Tháng Năm', 'Tháng Sáu',
  'Tháng Bảy', 'Tháng Tám', 'Tháng Chín',
  'Tháng Mười', 'Tháng Một', 'Tháng Chạp',
];

export function getLunarMonthName(month: number, isLeap: boolean = false): string {
  const name = LUNAR_MONTH_NAMES[month] || `Tháng ${month}`;
  return isLeap ? `${name} (nhuận)` : name;
}

/**
 * Format a lunar date as human-readable Vietnamese string
 */
export function formatLunarDate(lunar: LunarDate): string {
  const monthName = getLunarMonthName(lunar.month, lunar.isLeapMonth);
  return `Mùng ${lunar.day} ${monthName} năm ${getYearCanChi(lunar.year)}`;
}

/**
 * Check if a lunar date is Rằm (15th) or Mùng 1 (1st)
 */
export function isRamOrMung1(lunar: LunarDate): 'ram' | 'mung1' | null {
  if (lunar.day === 15) return 'ram';
  if (lunar.day === 1) return 'mung1';
  return null;
}

/**
 * Get all Rằm and Mùng 1 dates in a solar year as Solar dates
 */
export function getRamMung1InYear(year: number): Array<{ solar: SolarDate; lunar: LunarDate; type: 'ram' | 'mung1' }> {
  const results: Array<{ solar: SolarDate; lunar: LunarDate; type: 'ram' | 'mung1' }> = [];

  for (let month = 1; month <= 12; month++) {
    // Mùng 1
    const solar1 = lunarToSolar(1, month, year, false);
    if (solar1.day > 0) {
      results.push({
        solar: solar1,
        lunar: { day: 1, month, year, isLeapMonth: false, julianDay: solarToJulianDay(solar1.day, solar1.month, solar1.year) },
        type: 'mung1'
      });
    }

    // Rằm
    const solar15 = lunarToSolar(15, month, year, false);
    if (solar15.day > 0) {
      results.push({
        solar: solar15,
        lunar: { day: 15, month, year, isLeapMonth: false, julianDay: solarToJulianDay(solar15.day, solar15.month, solar15.year) },
        type: 'ram'
      });
    }
  }

  return results.sort((a, b) => {
    const jdA = solarToJulianDay(a.solar.day, a.solar.month, a.solar.year);
    const jdB = solarToJulianDay(b.solar.day, b.solar.month, b.solar.year);
    return jdA - jdB;
  });
}

/**
 * Calculate the next solar date for a recurring lunar anniversary.
 * Given a lunar day/month, find the next occurrence on or after today.
 */
export function getNextAnniversarySolar(
  lunarDay: number,
  lunarMonth: number,
  fromDate: Date = new Date()
): SolarDate {
  const currentYear = fromDate.getFullYear();
  const currentLunar = dateToLunar(fromDate);

  // Try current lunar year first
  let solar = lunarToSolar(lunarDay, lunarMonth, currentLunar.year, false);
  let solarDate = new Date(solar.year, solar.month - 1, solar.day);

  if (solarDate >= fromDate) {
    return solar;
  }

  // Try next lunar year
  solar = lunarToSolar(lunarDay, lunarMonth, currentLunar.year + 1, false);
  return solar;
}
