/**
 * Prayer Detail Screen — Giỗ Chạp
 * Full prayer text with auto-substituted placeholders.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { getPrayerById, getSetting } from '@/lib/db/database';
import { fillPrayerTemplate, PRAYER_CATEGORIES, PRAYER_CATEGORY_ICONS } from '@/constants/prayers';
import { dateToLunar, formatLunarDate } from '@/lib/lunar/converter';

export default function PrayerDetailScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerCategory, setPrayerCategory] = useState('');
  const [prayerDescription, setPrayerDescription] = useState('');
  const [filledContent, setFilledContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadPrayer();
  }, [id]);

  const loadPrayer = async () => {
    if (!id) return;
    try {
      const prayer = await getPrayerById(id);
      if (!prayer) return;

      setPrayerTitle(prayer.title);
      setPrayerCategory(prayer.category);
      setPrayerDescription(prayer.description);

      // Get user settings for substitution
      const homeownerName = await getSetting('homeownerName') || '............';
      const address = await getSetting('homeAddress') || '............';

      // Get current lunar date
      const todayLunar = dateToLunar(new Date());
      const lunarDateString = formatLunarDate(todayLunar);

      const filled = fillPrayerTemplate(prayer.content_template, {
        homeownerName,
        address,
        lunarDateString,
        ancestorName: '............',
      });

      setFilledContent(filled);
    } catch (error) {
      console.error('Error loading prayer:', error);
    }
  };

  const handleCopy = async () => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(filledContent);
      } else {
        await Clipboard.setStringAsync(filledContent);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${prayerTitle}\n\n${filledContent}`,
        title: prayerTitle,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const categoryIcon = PRAYER_CATEGORY_ICONS[prayerCategory] || '📄';
  const categoryLabel = PRAYER_CATEGORIES[prayerCategory] || prayerCategory;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={[styles.categoryBadge, { backgroundColor: colors.lunarHighlight }]}>
            <Text style={styles.categoryIcon}>{categoryIcon}</Text>
            <Text style={[styles.categoryText, { color: Colors.primary }]}>{categoryLabel}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{prayerTitle}</Text>
          {prayerDescription ? (
            <Text style={[styles.description, { color: colors.textSecondary }]}>{prayerDescription}</Text>
          ) : null}
        </View>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.lunarHighlight, borderColor: Colors.primary }]}>
          <Text style={[styles.infoBannerText, { color: Colors.primaryDark }]}>
            💡 Các phần "............" sẽ tự động được điền khi bạn cài đặt tên gia chủ trong phần Cài đặt.
          </Text>
        </View>

        {/* Prayer Content */}
        <View style={[styles.prayerBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.prayerText, { color: colors.text }]}>
            {filledContent || 'Đang tải...'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: copied ? Colors.success : Colors.primary }]}
            onPress={handleCopy}
          >
            <Text style={styles.actionBtnText}>
              {copied ? '✓ Đã sao chép!' : '📋 Sao chép'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.secondary }]}
            onPress={handleShare}
          >
            <Text style={styles.actionBtnText}>📤 Chia sẻ</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xxl * 2 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  titleSection: {
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    lineHeight: 34,
  },
  description: {
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
    lineHeight: 22,
  },
  infoBanner: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    marginBottom: Spacing.md,
  },
  infoBannerText: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  prayerBox: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  prayerText: {
    fontSize: FontSizes.lg,
    lineHeight: 30,
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
});
