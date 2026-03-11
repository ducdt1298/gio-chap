/**
 * Prayers List Screen — Giỗ Chạp
 * Browse prayer texts by category with search.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SectionList,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '@/constants/theme';
import { getAllPrayers, type PrayerRow } from '@/lib/db/database';
import { PRAYER_CATEGORIES, PRAYER_CATEGORY_ICONS } from '@/constants/prayers';

interface PrayerSection {
  title: string;
  icon: string;
  data: PrayerRow[];
}

export default function PrayersScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [allPrayers, setAllPrayers] = useState<PrayerRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadPrayers();
    }, [])
  );

  const loadPrayers = async () => {
    try {
      const all = await getAllPrayers();
      setAllPrayers(all);
    } catch (error) {
      console.error('Error loading prayers:', error);
    }
  };

  // Filter + group prayers into sections
  const sections = useMemo(() => {
    let filtered = allPrayers;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = allPrayers.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (PRAYER_CATEGORIES[p.category] || '').toLowerCase().includes(q)
      );
    }

    const grouped = new Map<string, PrayerRow[]>();
    for (const prayer of filtered) {
      if (!grouped.has(prayer.category)) grouped.set(prayer.category, []);
      grouped.get(prayer.category)!.push(prayer);
    }

    const secs: PrayerSection[] = [];
    for (const [cat, prayers] of grouped) {
      secs.push({
        title: PRAYER_CATEGORIES[cat] || cat,
        icon: PRAYER_CATEGORY_ICONS[cat] || '📄',
        data: prayers,
      });
    }
    return secs;
  }, [allPrayers, searchQuery]);

  const renderSectionHeader = ({ section }: { section: PrayerSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.backgroundSecondary }]}>
      <Text style={styles.sectionIcon}>{section.icon}</Text>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
      <View style={[styles.sectionBadge, { backgroundColor: colors.lunarHighlight }]}>
        <Text style={[styles.sectionCount, { color: Colors.primary }]}>{section.data.length}</Text>
      </View>
    </View>
  );

  const renderPrayer = ({ item }: { item: PrayerRow }) => (
    <TouchableOpacity
      style={[styles.prayerCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }, Shadows.sm]}
      onPress={() => router.push(`/prayer/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.prayerContent}>
        <Text style={[styles.prayerTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.prayerDesc, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      <View style={styles.prayerArrow}>
        <Text style={[styles.arrowText, { color: colors.textMuted }]}>▸</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.secondary }]}>
        <Text style={styles.headerTitle}>📖 Thư viện Văn khấn</Text>
        <Text style={styles.headerSubtitle}>
          Văn khấn tự động chèn tên gia chủ và ngày Âm lịch
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm văn khấn..."
          placeholderTextColor={colors.textMuted}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={[styles.clearBtn, { color: colors.textMuted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {sections.length === 0 && allPrayers.length > 0 ? (
        <View style={styles.emptySearch}>
          <Text style={styles.emptySearchIcon}>🔍</Text>
          <Text style={[styles.emptySearchText, { color: colors.textSecondary }]}>
            Không tìm thấy văn khấn phù hợp với "{searchQuery}"
          </Text>
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptySearch}>
          <Text style={[styles.emptySearchText, { color: colors.textSecondary }]}>
            Đang tải văn khấn...
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderPrayer}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
        />
      )}
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
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'web' ? Spacing.sm : Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    paddingVertical: Spacing.xs,
  },
  clearBtn: {
    fontSize: FontSizes.lg,
    paddingLeft: Spacing.sm,
  },
  list: {
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    flex: 1,
  },
  sectionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  sectionCount: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  prayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  prayerContent: {
    flex: 1,
  },
  prayerTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  prayerDesc: {
    fontSize: FontSizes.sm,
    marginTop: 4,
    lineHeight: 18,
  },
  prayerArrow: {
    marginLeft: Spacing.sm,
  },
  arrowText: {
    fontSize: FontSizes.xl,
  },
  emptySearch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptySearchIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptySearchText: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});
