/**
 * Journal Events List — Giỗ Chạp Phase 2
 * Timeline view of ritual events by year.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '@/constants/theme';
import { getAllEvents, getFirstPhotoForEvent, EVENT_TYPES, type JournalEventRow } from '@/lib/db/journal';
import { Image } from 'expo-image';

export default function JournalListScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [events, setEvents] = useState<JournalEventRow[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [thumbnails, setThumbnails] = useState<Record<string, string | null>>({});
  const [refreshing, setRefreshing] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const loadEvents = useCallback(async () => {
    try {
      const data = await getAllEvents(selectedYear);
      setEvents(data);
      // Load thumbnails
      const thumbs: Record<string, string | null> = {};
      for (const event of data) {
        thumbs[event.id] = await getFirstPhotoForEvent(event.id);
      }
      setThumbnails(thumbs);
    } catch (error) {
      console.error('Error loading journal events:', error);
    }
  }, [selectedYear]);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }, [loadEvents]);

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatExpense = (amount: number) => {
    if (!amount) return '';
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const renderEvent = ({ item }: { item: JournalEventRow }) => {
    const eventType = EVENT_TYPES[item.event_type] || EVENT_TYPES.custom;
    const thumb = thumbnails[item.id];

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }, Shadows.sm]}
        onPress={() => router.push(`/journal/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Thumbnail */}
        <View style={styles.cardLeft}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.thumbnail} contentFit="cover" />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.lunarHighlight }]}>
              <Text style={styles.thumbnailEmoji}>{eventType.icon}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.cardCenter}>
          <View style={[styles.eventTypeBadge, { backgroundColor: colors.lunarHighlight }]}>
            <Text style={styles.eventTypeIcon}>{eventType.icon}</Text>
            <Text style={[styles.eventTypeText, { color: Colors.primary }]}>{eventType.label}</Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.cardDate, { color: colors.textMuted }]}>
            📅 {formatDate(item.event_date_solar)}
            {item.event_date_lunar ? ` (${item.event_date_lunar})` : ''}
          </Text>
          {item.total_expense > 0 && (
            <Text style={[styles.cardExpense, { color: Colors.secondary }]}>
              💰 {formatExpense(item.total_expense)}
            </Text>
          )}
        </View>

        {/* Arrow */}
        <Text style={[styles.cardArrow, { color: colors.textMuted }]}>▶</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.secondary }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Về</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📓 Nhật ký cúng lễ</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/journal/new')}
          >
            <Text style={styles.addButtonText}>+ Thêm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Year Selector */}
      <View style={[styles.yearSelector, { backgroundColor: colors.surface }]}>
        {years.map(year => (
          <TouchableOpacity
            key={year}
            style={[
              styles.yearButton,
              selectedYear === year && [styles.yearButtonActive, { backgroundColor: Colors.primary }],
            ]}
            onPress={() => setSelectedYear(year)}
          >
            <Text style={[
              styles.yearText,
              { color: colors.textSecondary },
              selectedYear === year && styles.yearTextActive,
            ]}>
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Event List */}
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📓</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Chưa có ghi chép nào</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Ghi lại những dịp cúng lễ để lưu giữ kỷ niệm gia đình.
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: Colors.primary }]}
            onPress={() => router.push('/journal/new')}
          >
            <Text style={styles.emptyButtonText}>➕ Tạo ghi chép đầu tiên</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'web' ? Spacing.xl : 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: { padding: Spacing.xs },
  backText: { color: '#fff', fontSize: FontSizes.md, fontWeight: '600' },
  headerTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: '#fff' },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.md },
  yearSelector: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  yearButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  yearButtonActive: {},
  yearText: { fontSize: FontSizes.sm, fontWeight: '600' },
  yearTextActive: { color: '#fff' },
  list: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  cardLeft: { marginRight: Spacing.md },
  thumbnail: { width: 64, height: 64, borderRadius: BorderRadius.md },
  thumbnailPlaceholder: {
    width: 64, height: 64,
    borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  thumbnailEmoji: { fontSize: 28 },
  cardCenter: { flex: 1 },
  eventTypeBadge: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.full, gap: 4, marginBottom: 4,
  },
  eventTypeIcon: { fontSize: 12 },
  eventTypeText: { fontSize: FontSizes.xs, fontWeight: '600' },
  cardTitle: { fontSize: FontSizes.md, fontWeight: '700' },
  cardDate: { fontSize: FontSizes.sm, marginTop: 2 },
  cardExpense: { fontSize: FontSizes.sm, fontWeight: '600', marginTop: 2 },
  cardArrow: { fontSize: FontSizes.sm, marginLeft: Spacing.sm },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSizes.xl, fontWeight: '700', marginBottom: Spacing.sm },
  emptyDesc: { fontSize: FontSizes.md, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },
  emptyButton: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.lg },
});
