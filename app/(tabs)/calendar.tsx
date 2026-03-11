/**
 * Lunar Calendar Screen — Giỗ Chạp
 * Full calendar view with dual Solar/Lunar dates.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '@/constants/theme';
import {
  solarToLunar,
  dateToLunar,
  getDayCanChi,
  getHoangDao,
  getYearCanChi,
  getLunarMonthName,
  isRamOrMung1,
  solarToJulianDay,
} from '@/lib/lunar/converter';
import { getAllAncestors, type AncestorRow } from '@/lib/db/database';
import type { LunarDate } from '@/types';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTH_NAMES = [
  '', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

interface DayCellData {
  solarDay: number;
  solarMonth: number;
  solarYear: number;
  lunar: LunarDate;
  isCurrentMonth: boolean;
  isToday: boolean;
  isRam: boolean;
  isMung1: boolean;
  hasAnniversary: boolean;
  ancestorNames: string[];
}

export default function CalendarScreen() {
  const colors = useThemeColors();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<DayCellData | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [ancestors, setAncestors] = useState<AncestorRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAllAncestors().then(setAncestors).catch(console.error);
    }, [])
  );

  // Generate calendar grid data
  const calendarData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const startDow = firstDay.getDay(); // 0=Sun
    const daysInMonth = lastDay.getDate();

    // Build anniversary lookup: "lunarDay-lunarMonth" -> ancestor names
    const annivMap = new Map<string, string[]>();
    for (const a of ancestors) {
      const key = `${a.death_day_lunar}-${a.death_month_lunar}`;
      if (!annivMap.has(key)) annivMap.set(key, []);
      annivMap.get(key)!.push(`${a.family_rank} ${a.full_name}`);
    }

    const today = new Date();
    const cells: DayCellData[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = currentMonth - 1 || 12;
      const y = currentMonth === 1 ? currentYear - 1 : currentYear;
      const lunar = solarToLunar(d, m, y);
      cells.push({
        solarDay: d,
        solarMonth: m,
        solarYear: y,
        lunar,
        isCurrentMonth: false,
        isToday: false,
        isRam: lunar.day === 15,
        isMung1: lunar.day === 1,
        hasAnniversary: annivMap.has(`${lunar.day}-${lunar.month}`),
        ancestorNames: annivMap.get(`${lunar.day}-${lunar.month}`) || [],
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const lunar = solarToLunar(d, currentMonth, currentYear);
      const isToday = d === today.getDate() && currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear();
      cells.push({
        solarDay: d,
        solarMonth: currentMonth,
        solarYear: currentYear,
        lunar,
        isCurrentMonth: true,
        isToday,
        isRam: lunar.day === 15,
        isMung1: lunar.day === 1,
        hasAnniversary: annivMap.has(`${lunar.day}-${lunar.month}`),
        ancestorNames: annivMap.get(`${lunar.day}-${lunar.month}`) || [],
      });
    }

    // Next month padding to fill the grid
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth + 1 > 12 ? 1 : currentMonth + 1;
      const y = currentMonth + 1 > 12 ? currentYear + 1 : currentYear;
      const lunar = solarToLunar(d, m, y);
      cells.push({
        solarDay: d,
        solarMonth: m,
        solarYear: y,
        lunar,
        isCurrentMonth: false,
        isToday: false,
        isRam: lunar.day === 15,
        isMung1: lunar.day === 1,
        hasAnniversary: annivMap.has(`${lunar.day}-${lunar.month}`),
        ancestorNames: annivMap.get(`${lunar.day}-${lunar.month}`) || [],
      });
    }

    return cells;
  }, [currentYear, currentMonth, ancestors]);

  const navigateMonth = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth() + 1);
    setCurrentYear(today.getFullYear());
  };

  const onDayPress = (cell: DayCellData) => {
    setSelectedDay(cell);
    setShowDayModal(true);
  };

  // Get lunar month info for the header
  const midMonthLunar = solarToLunar(15, currentMonth, currentYear);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.secondary }]}>
        <Text style={styles.headerTitle}>📅 Lịch Âm Dương</Text>
      </View>

      {/* Month Navigator */}
      <View style={[styles.monthNav, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButton}>
          <Text style={[styles.navArrow, { color: colors.tint }]}>◀</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goToToday} style={styles.monthTitleContainer}>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </Text>
          <Text style={[styles.monthLunar, { color: colors.textSecondary }]}>
            {getLunarMonthName(midMonthLunar.month, midMonthLunar.isLeapMonth)} - {getYearCanChi(midMonthLunar.year)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButton}>
          <Text style={[styles.navArrow, { color: colors.tint }]}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={[styles.weekdayRow, { borderBottomColor: colors.border }]}>
        {WEEKDAYS.map((day, i) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, { color: i === 0 ? Colors.error : colors.textSecondary }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <ScrollView style={styles.gridContainer}>
        <View style={styles.grid}>
          {calendarData.map((cell, index) => {
            const isWeekend = index % 7 === 0; // Sunday
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  cell.isToday && [styles.todayCell, { borderColor: Colors.primary }],
                  !cell.isCurrentMonth && styles.fadedCell,
                  { borderBottomColor: colors.borderLight },
                ]}
                onPress={() => onDayPress(cell)}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.solarDayText,
                    { color: cell.isCurrentMonth ? (isWeekend ? Colors.error : colors.text) : colors.textMuted },
                    cell.isToday && { color: Colors.primary, fontWeight: '900' },
                  ]}
                >
                  {cell.solarDay}
                </Text>
                <Text
                  style={[
                    styles.lunarDayText,
                    { color: colors.textMuted },
                    cell.isMung1 && { color: Colors.secondary, fontWeight: '700' },
                    cell.isRam && { color: Colors.primary, fontWeight: '700' },
                  ]}
                >
                  {cell.isMung1 ? `${cell.lunar.day}/${cell.lunar.month}` : cell.lunar.day}
                </Text>
                {cell.hasAnniversary && (
                  <View style={[styles.annivDot, { backgroundColor: Colors.primary }]} />
                )}
                {(cell.isRam || cell.isMung1) && !cell.hasAnniversary && (
                  <View style={[styles.annivDot, { backgroundColor: Colors.secondary, opacity: 0.5 }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={[styles.legend, { borderTopColor: colors.border }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Ngày Giỗ</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.secondary, opacity: 0.5 }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Rằm / Mùng 1</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendCircle, { borderColor: Colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Hôm nay</Text>
          </View>
        </View>
      </ScrollView>

      {/* Day Detail Modal */}
      <Modal visible={showDayModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {selectedDay && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {selectedDay.solarDay}/{selectedDay.solarMonth}/{selectedDay.solarYear}
                  </Text>
                  <TouchableOpacity onPress={() => setShowDayModal(false)}>
                    <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

                <View style={styles.modalBody}>
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>🌙 Âm lịch:</Text>
                    <Text style={[styles.modalValue, { color: colors.text }]}>
                      {selectedDay.lunar.day}/{selectedDay.lunar.month}
                      {selectedDay.lunar.isLeapMonth ? ' (nhuận)' : ''}
                      {' '} năm {getYearCanChi(selectedDay.lunar.year)}
                    </Text>
                  </View>

                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>🔮 Ngày:</Text>
                    <Text style={[styles.modalValue, { color: colors.text }]}>
                      {getDayCanChi(selectedDay.lunar.julianDay)}
                    </Text>
                  </View>

                  {(selectedDay.isRam || selectedDay.isMung1) && (
                    <View style={[styles.specialBadge, { backgroundColor: colors.lunarHighlight }]}>
                      <Text style={[styles.specialBadgeText, { color: Colors.secondary }]}>
                        {selectedDay.isRam ? '🌕 Ngày Rằm' : '🌑 Ngày Mùng 1'} — Nên cúng lễ
                      </Text>
                    </View>
                  )}

                  {selectedDay.hasAnniversary && (
                    <View style={[styles.specialBadge, { backgroundColor: '#FFF3E0' }]}>
                      <Text style={[styles.specialBadgeText, { color: Colors.primary }]}>
                        🕯️ Ngày Giỗ: {selectedDay.ancestorNames.join(', ')}
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.hoangDaoTitle, { color: colors.textSecondary }]}>
                    ⭐ Giờ Hoàng Đạo:
                  </Text>
                  <View style={styles.hoangDaoGrid}>
                    {getHoangDao(selectedDay.lunar.julianDay).map((gio, i) => (
                      <View key={i} style={[styles.hoangDaoItem, { backgroundColor: colors.lunarHighlight }]}>
                        <Text style={[styles.hoangDaoItemText, { color: Colors.primary }]}>{gio}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'web' ? Spacing.xl : 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  navButton: {
    padding: Spacing.sm,
  },
  navArrow: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  monthTitleContainer: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  monthLunar: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  weekdayRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: Spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  weekdayText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  gridContainer: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  todayCell: {
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
  },
  fadedCell: {
    opacity: 0.35,
  },
  solarDayText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  lunarDayText: {
    fontSize: FontSizes.xs,
    marginTop: 1,
  },
  annivDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  legendText: {
    fontSize: FontSizes.xs,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xxl,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
  },
  modalClose: {
    fontSize: FontSizes.xxl,
    fontWeight: '300',
  },
  modalDivider: {
    height: 1,
    marginHorizontal: Spacing.lg,
  },
  modalBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  modalRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  modalLabel: {
    fontSize: FontSizes.md,
    marginRight: Spacing.sm,
    minWidth: 90,
  },
  modalValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    flex: 1,
  },
  specialBadge: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.sm,
  },
  specialBadgeText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  hoangDaoTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  hoangDaoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  hoangDaoItem: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  hoangDaoItemText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});
