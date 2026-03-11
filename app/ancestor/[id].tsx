/**
 * Ancestor Detail Screen — Giỗ Chạp
 * View and edit an ancestor profile.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '@/constants/theme';
import { getAncestorById, deleteAncestor, type AncestorRow } from '@/lib/db/database';
import {
  getNextAnniversarySolar,
  getLunarMonthName,
  getYearCanChi,
  getDayCanChi,
  solarToJulianDay,
} from '@/lib/lunar/converter';
import { recalculateAllReminders } from '@/lib/notifications/scheduler';

export default function AncestorDetailScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ancestor, setAncestor] = useState<AncestorRow | null>(null);

  useEffect(() => {
    if (id) {
      getAncestorById(id).then(setAncestor).catch(console.error);
    }
  }, [id]);

  const handleDelete = () => {
    if (!ancestor) return;
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
            router.back();
          },
        },
      ]
    );
  };

  if (!ancestor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải...</Text>
      </View>
    );
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const nextSolar = getNextAnniversarySolar(ancestor.death_day_lunar, ancestor.death_month_lunar, today);
  const nextDate = new Date(nextSolar.year, nextSolar.month - 1, nextSolar.day);
  const daysUntil = Math.round((nextDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
  const yearsSinceDeath = today.getFullYear() - ancestor.death_year_solar;

  let gioType = 'Giỗ thường';
  let gioTypeDesc = 'Ngày giỗ hàng năm theo phong tục';
  if (yearsSinceDeath <= 1) {
    gioType = 'Giỗ đầu';
    gioTypeDesc = 'Giỗ đầu tiên sau khi mất, tròn 1 năm';
  } else if (yearsSinceDeath <= 2) {
    gioType = 'Giỗ hết';
    gioTypeDesc = 'Giỗ năm thứ 2, hết tang';
  }

  const lunarMonthName = getLunarMonthName(ancestor.death_month_lunar);
  const deathJd = solarToJulianDay(ancestor.death_day_solar, ancestor.death_month_solar, ancestor.death_year_solar);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Portrait */}
      <View style={styles.portraitSection}>
        {ancestor.photo_uri ? (
          <Image source={{ uri: ancestor.photo_uri }} style={styles.portrait} contentFit="cover" />
        ) : (
          <View style={[styles.portraitPlaceholder, { backgroundColor: colors.lunarHighlight }]}>
            <Text style={styles.portraitEmoji}>🕯️</Text>
          </View>
        )}
        <Text style={[styles.rank, { color: Colors.primary }]}>{ancestor.family_rank}</Text>
        <Text style={[styles.name, { color: colors.text }]}>{ancestor.full_name}</Text>
      </View>

      {/* Next Anniversary Card */}
      <View style={[styles.anniversaryCard, { backgroundColor: Colors.primary }, Shadows.lg]}>
        <Text style={styles.anniversaryLabel}>Ngày Giỗ tới</Text>
        <View style={styles.anniversaryRow}>
          <View style={styles.anniversaryDateCol}>
            <Text style={styles.anniversaryDate}>
              {nextSolar.day}/{nextSolar.month}/{nextSolar.year}
            </Text>
            <Text style={styles.anniversaryLunar}>
              ({ancestor.death_day_lunar}/{ancestor.death_month_lunar} ÂL)
            </Text>
          </View>
          <View style={styles.daysUntilCircle}>
            <Text style={styles.daysUntilNum}>{daysUntil}</Text>
            <Text style={styles.daysUntilLabel}>ngày nữa</Text>
          </View>
        </View>
        <View style={styles.gioTypeBadge}>
          <Text style={styles.gioTypeText}>{gioType}</Text>
        </View>
      </View>

      {/* Details Section */}
      <View style={[styles.detailsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Thông tin chi tiết</Text>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Ngày mất (ÂL):</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {ancestor.death_day_lunar} {lunarMonthName} năm {getYearCanChi(ancestor.death_year_lunar)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Ngày mất (DL):</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {ancestor.death_day_solar}/{ancestor.death_month_solar}/{ancestor.death_year_solar}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Ngày Can Chi:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {getDayCanChi(deathJd)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Đã mất:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {yearsSinceDeath} năm — {gioTypeDesc}
          </Text>
        </View>

        {ancestor.burial_place ? (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Nơi an táng:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{ancestor.burial_place}</Text>
          </View>
        ) : null}

        {ancestor.notes ? (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Ghi chú:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{ancestor.notes}</Text>
          </View>
        ) : null}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.error }]}
          onPress={handleDelete}
        >
          <Text style={styles.actionButtonText}>🗑️ Xóa hồ sơ</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: Spacing.xxl * 2 }} />
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
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: FontSizes.md,
  },
  portraitSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  portrait: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  portraitPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitEmoji: {
    fontSize: 48,
  },
  rank: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: Spacing.md,
  },
  name: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    marginTop: Spacing.xs,
  },
  anniversaryCard: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  anniversaryLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  anniversaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  anniversaryDateCol: {},
  anniversaryDate: {
    color: '#FFFFFF',
    fontSize: FontSizes.xxl,
    fontWeight: '800',
  },
  anniversaryLunar: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSizes.md,
    marginTop: 2,
  },
  daysUntilCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysUntilNum: {
    color: '#FFFFFF',
    fontSize: FontSizes.xxl,
    fontWeight: '900',
    lineHeight: 30,
  },
  daysUntilLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
  },
  gioTypeBadge: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  gioTypeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  detailsCard: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  detailRow: {
    marginBottom: Spacing.md,
  },
  detailLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  actions: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
});
