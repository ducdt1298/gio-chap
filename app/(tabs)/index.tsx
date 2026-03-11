/**
 * Home Dashboard — Giỗ Chạp
 * Shows today's lunar date, upcoming events, and quick actions.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '@/constants/theme';
import {
  dateToLunar,
  formatLunarDate,
  getDayCanChi,
  getHoangDao,
  getYearCanChi,
  getNextAnniversarySolar,
  solarToJulianDay,
  isRamOrMung1,
} from '@/lib/lunar/converter';
import { getAllAncestors, type AncestorRow } from '@/lib/db/database';
import type { LunarDate } from '@/types';

interface UpcomingEvent {
  title: string;
  subtitle: string;
  daysUntil: number;
  type: 'gio' | 'ram' | 'mung1';
  icon: string;
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [todayLunar, setTodayLunar] = useState<LunarDate | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [ancestorCount, setAncestorCount] = useState(0);

  const loadData = useCallback(async () => {
    const today = new Date();
    const lunar = dateToLunar(today);
    setTodayLunar(lunar);

    try {
      const ancestors = await getAllAncestors();
      setAncestorCount(ancestors.length);

      // Calculate upcoming anniversaries
      const events: UpcomingEvent[] = [];

      for (const ancestor of ancestors) {
        const nextSolar = getNextAnniversarySolar(
          ancestor.death_day_lunar,
          ancestor.death_month_lunar,
          today
        );
        const nextDate = new Date(nextSolar.year, nextSolar.month - 1, nextSolar.day);
        // Normalize to start of day to avoid time-of-day issues
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const daysUntil = Math.round((nextDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil >= 0 && daysUntil <= 30) {
          events.push({
            title: `Giỗ ${ancestor.family_rank} ${ancestor.full_name}`,
            subtitle: `${nextSolar.day}/${nextSolar.month}/${nextSolar.year} (${ancestor.death_day_lunar}/${ancestor.death_month_lunar} ÂL)`,
            daysUntil,
            type: 'gio',
            icon: '🕯️',
          });
        }
      }

      // Add upcoming Rằm/Mùng 1
      for (let i = 0; i < 35; i++) {
        const futureDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
        const futureLunar = dateToLunar(futureDate);
        const ramMung = isRamOrMung1(futureLunar);
        if (ramMung && i > 0) {
          events.push({
            title: ramMung === 'ram' ? `Rằm tháng ${futureLunar.month}` : `Mùng 1 tháng ${futureLunar.month}`,
            subtitle: `${futureDate.getDate()}/${futureDate.getMonth() + 1}/${futureDate.getFullYear()}`,
            daysUntil: i,
            type: ramMung,
            icon: ramMung === 'ram' ? '🌕' : '🌑',
          });
          if (events.filter(e => e.type !== 'gio').length >= 2) break;
        }
      }

      events.sort((a, b) => a.daysUntil - b.daysUntil);
      setUpcomingEvents(events.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const today = new Date();
  const jd = todayLunar?.julianDay ?? solarToJulianDay(today.getDate(), today.getMonth() + 1, today.getFullYear());
  const dayCanChi = getDayCanChi(jd);
  const hoangDaoList = getHoangDao(jd);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.secondary }]}>
        <Text style={styles.headerTitle}>🙏 Giỗ Chạp</Text>
        <Text style={styles.headerSubtitle}>Quản lý Tâm linh & Gia phả số</Text>
      </View>

      {/* Today's Lunar Info Card */}
      <View style={[styles.lunarCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }, Shadows.lg]}>
        <View style={styles.lunarCardHeader}>
          <Text style={[styles.lunarDayBig, { color: Colors.primary }]}>
            {todayLunar?.day ?? '--'}
          </Text>
          <View style={styles.lunarCardRight}>
            <Text style={[styles.lunarMonthYear, { color: colors.text }]}>
              {todayLunar ? `Tháng ${todayLunar.month}${todayLunar.isLeapMonth ? ' (nhuận)' : ''}` : '...'}
            </Text>
            <Text style={[styles.lunarYearCanChi, { color: colors.textSecondary }]}>
              {todayLunar ? `Năm ${getYearCanChi(todayLunar.year)}` : '...'}
            </Text>
            <Text style={[styles.solarDate, { color: colors.textMuted }]}>
              {`${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()} (Dương lịch)`}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

        <View style={styles.canChiRow}>
          <Text style={[styles.canChiLabel, { color: colors.textSecondary }]}>Ngày:</Text>
          <Text style={[styles.canChiValue, { color: colors.text }]}>{dayCanChi}</Text>
        </View>

        <View style={styles.hoangDaoSection}>
          <Text style={[styles.hoangDaoLabel, { color: colors.textSecondary }]}>⭐ Giờ Hoàng Đạo:</Text>
          <View style={styles.hoangDaoList}>
            {hoangDaoList.slice(0, 4).map((gio, index) => (
              <View key={index} style={[styles.hoangDaoBadge, { backgroundColor: colors.lunarHighlight }]}>
                <Text style={[styles.hoangDaoText, { color: Colors.primary }]}>{gio}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: Colors.primary }]}
          onPress={() => router.push('/ancestor/new')}
        >
          <Text style={styles.quickActionIcon}>➕</Text>
          <Text style={styles.quickActionText}>Thêm Gia tiên</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: Colors.secondary }]}
          onPress={() => router.push('/(tabs)/prayers')}
        >
          <Text style={styles.quickActionIcon}>📖</Text>
          <Text style={styles.quickActionText}>Văn khấn</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: '#5C6B3C' }]}
          onPress={() => router.push('/journal')}
        >
          <Text style={styles.quickActionIcon}>📓</Text>
          <Text style={styles.quickActionText}>Nhật ký</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Events */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📌 Sự kiện sắp tới</Text>
      </View>

      {upcomingEvents.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={styles.emptyIcon}>🏠</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {ancestorCount === 0
              ? 'Chưa có gia tiên nào. Hãy thêm để theo dõi ngày Giỗ!'
              : 'Không có sự kiện nào trong 30 ngày tới.'}
          </Text>
          {ancestorCount === 0 && (
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: Colors.primary }]}
              onPress={() => router.push('/ancestor/new')}
            >
              <Text style={styles.emptyButtonText}>Thêm Gia tiên đầu tiên</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        upcomingEvents.map((event, index) => (
          <View
            key={index}
            style={[
              styles.eventCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                borderLeftColor: event.type === 'gio' ? Colors.primary : event.type === 'ram' ? Colors.secondary : Colors.accent,
              },
              Shadows.sm,
            ]}
          >
            <Text style={styles.eventIcon}>{event.icon}</Text>
            <View style={styles.eventInfo}>
              <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
              <Text style={[styles.eventSubtitle, { color: colors.textMuted }]}>{event.subtitle}</Text>
            </View>
            <View style={[styles.daysUntilBadge, {
              backgroundColor: event.daysUntil <= 1 ? Colors.error : event.daysUntil <= 7 ? Colors.warning : colors.lunarHighlight
            }]}>
              <Text style={[styles.daysUntilText, {
                color: event.daysUntil <= 7 ? '#fff' : Colors.primary
              }]}>
                {event.daysUntil === 0 ? 'Hôm nay' : `${event.daysUntil} ngày`}
              </Text>
            </View>
          </View>
        ))
      )}

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingTop: Platform.OS === 'web' ? Spacing.xl : 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: FontSizes.md,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.xs,
  },
  lunarCard: {
    marginHorizontal: Spacing.md,
    marginTop: -Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  lunarCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lunarDayBig: {
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 70,
    marginRight: Spacing.lg,
  },
  lunarCardRight: {
    flex: 1,
  },
  lunarMonthYear: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  lunarYearCanChi: {
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
  },
  solarDate: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  canChiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  canChiLabel: {
    fontSize: FontSizes.md,
    marginRight: Spacing.sm,
  },
  canChiValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  hoangDaoSection: {
    marginTop: Spacing.xs,
  },
  hoangDaoLabel: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  hoangDaoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  hoangDaoBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  hoangDaoText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  quickActionBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  eventIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  eventSubtitle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  daysUntilBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    minWidth: 60,
    alignItems: 'center',
  },
  daysUntilText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  emptyState: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSizes.md,
  },
});
