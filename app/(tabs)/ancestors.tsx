/**
 * Ancestors List Screen — Giỗ Chạp
 * Displays all ancestor profiles with search and upcoming anniversary info.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '@/constants/theme';
import { getAllAncestors, deleteAncestor, type AncestorRow } from '@/lib/db/database';
import { getNextAnniversarySolar } from '@/lib/lunar/converter';
import { recalculateAllReminders } from '@/lib/notifications/scheduler';

export default function AncestorsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [ancestors, setAncestors] = useState<AncestorRow[]>([]);
  const [filteredAncestors, setFilteredAncestors] = useState<AncestorRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadAncestors = useCallback(async () => {
    try {
      const data = await getAllAncestors();
      setAncestors(data);
      filterAncestors(data, searchQuery);
    } catch (error) {
      console.error('Error loading ancestors:', error);
    }
  }, [searchQuery]);

  const filterAncestors = useCallback((data: AncestorRow[], query: string) => {
    if (!query.trim()) {
      setFilteredAncestors(data);
      return;
    }
    const q = query.toLowerCase().trim();
    const filtered = data.filter(a =>
      a.full_name.toLowerCase().includes(q) ||
      a.family_rank.toLowerCase().includes(q) ||
      a.burial_place.toLowerCase().includes(q)
    );
    setFilteredAncestors(filtered);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    filterAncestors(ancestors, text);
  }, [ancestors, filterAncestors]);

  useFocusEffect(
    useCallback(() => {
      loadAncestors();
    }, [loadAncestors])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAncestors();
    setRefreshing(false);
  }, [loadAncestors]);

  const handleDelete = (ancestor: AncestorRow) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa hồ sơ ${ancestor.family_rank} ${ancestor.full_name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await deleteAncestor(ancestor.id);
            recalculateAllReminders().catch(console.error);
            await loadAncestors();
          },
        },
      ]
    );
  };

  const renderAncestor = ({ item }: { item: AncestorRow }) => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const nextSolar = getNextAnniversarySolar(item.death_day_lunar, item.death_month_lunar, today);
    const nextDate = new Date(nextSolar.year, nextSolar.month - 1, nextSolar.day);
    const daysUntil = Math.round((nextDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
    const yearsSinceDeath = today.getFullYear() - item.death_year_solar;

    let gioType = 'Giỗ thường';
    if (yearsSinceDeath <= 1) gioType = 'Giỗ đầu';
    else if (yearsSinceDeath <= 2) gioType = 'Giỗ hết';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }, Shadows.sm]}
        onPress={() => router.push(`/ancestor/${item.id}`)}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          {item.photo_uri ? (
            <Image source={{ uri: item.photo_uri }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.lunarHighlight }]}>
              <Text style={styles.avatarEmoji}>🕯️</Text>
            </View>
          )}
        </View>

        <View style={styles.cardCenter}>
          <Text style={[styles.cardRank, { color: Colors.primary }]}>{item.family_rank}</Text>
          <Text style={[styles.cardName, { color: colors.text }]}>{item.full_name}</Text>
          <Text style={[styles.cardDate, { color: colors.textMuted }]}>
            Ngày mất: {item.death_day_lunar}/{item.death_month_lunar} (ÂL) — {gioType}
          </Text>
          {item.burial_place ? (
            <Text style={[styles.cardPlace, { color: colors.textMuted }]} numberOfLines={1}>
              📍 {item.burial_place}
            </Text>
          ) : null}
        </View>

        <View style={styles.cardRight}>
          <View style={[styles.daysUntilBadge, {
            backgroundColor: daysUntil <= 3 ? Colors.error :
              daysUntil <= 7 ? Colors.warning :
              daysUntil <= 30 ? Colors.primary : colors.lunarHighlight,
          }]}>
            <Text style={[styles.daysUntilNum, {
              color: daysUntil <= 30 ? '#fff' : Colors.primary,
            }]}>
              {daysUntil}
            </Text>
            <Text style={[styles.daysUntilLabel, {
              color: daysUntil <= 30 ? 'rgba(255,255,255,0.8)' : colors.textMuted,
            }]}>
              ngày
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.secondary }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>🕯️ Gia Tiên</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/ancestor/new')}
          >
            <Text style={styles.addButtonText}>+ Thêm</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerCount}>
          {ancestors.length > 0 ? `${ancestors.length} hồ sơ` : 'Chưa có hồ sơ nào'}
        </Text>
      </View>

      {/* Search Bar */}
      {ancestors.length > 0 && (
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Tìm theo tên, thứ bậc..."
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={[styles.clearBtn, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {ancestors.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏠</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Bắt đầu lưu giữ gia phả</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Thêm hồ sơ người quá cố để ứng dụng tự động tính toán ngày Giỗ và nhắc nhở bạn.
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: Colors.primary }]}
            onPress={() => router.push('/ancestor/new')}
          >
            <Text style={styles.emptyButtonText}>➕ Thêm Gia tiên đầu tiên</Text>
          </TouchableOpacity>
        </View>
      ) : filteredAncestors.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Không tìm thấy</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Không có gia tiên nào phù hợp với "{searchQuery}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAncestors}
          keyExtractor={(item) => item.id}
          renderItem={renderAncestor}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FontSizes.md,
  },
  headerCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSizes.sm,
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
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  card: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  cardLeft: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  cardCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  cardRank: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginTop: 2,
  },
  cardDate: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  cardPlace: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  cardRight: {
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  daysUntilBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysUntilNum: {
    fontSize: FontSizes.lg,
    fontWeight: '900',
    lineHeight: 20,
  },
  daysUntilLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  emptyDesc: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSizes.lg,
  },
});
