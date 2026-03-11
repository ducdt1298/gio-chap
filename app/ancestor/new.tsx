/**
 * New Ancestor Form Screen — Giỗ Chạp
 * Create a new ancestor profile with lunar death date.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast, { type ToastRef } from '@/components/Toast';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { insertAncestor, generateId } from '@/lib/db/database';
import { lunarToSolar } from '@/lib/lunar/converter';
import { recalculateAllReminders } from '@/lib/notifications/scheduler';

const FAMILY_RANKS = [
  'Ông nội', 'Bà nội', 'Ông ngoại', 'Bà ngoại',
  'Cha', 'Mẹ', 'Bác', 'Chú', 'Cậu', 'Dì', 'Cô',
  'Anh', 'Chị', 'Em', 'Con', 'Cháu', 'Khác',
];

export default function NewAncestorScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [familyRank, setFamilyRank] = useState('');
  const [deathDayLunar, setDeathDayLunar] = useState('');
  const [deathMonthLunar, setDeathMonthLunar] = useState('');
  const [deathYearLunar, setDeathYearLunar] = useState('');
  const [burialPlace, setBurialPlace] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showRankPicker, setShowRankPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const toastRef = useRef<ToastRef>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên.');
      return;
    }
    const day = parseInt(deathDayLunar);
    const month = parseInt(deathMonthLunar);
    const year = parseInt(deathYearLunar);

    if (!day || !month || !year || day < 1 || day > 30 || month < 1 || month > 12) {
      Alert.alert('Ngày không hợp lệ', 'Vui lòng nhập ngày mất Âm lịch hợp lệ (ngày 1-30, tháng 1-12).');
      return;
    }

    setSaving(true);
    try {
      const solar = lunarToSolar(day, month, year, false);

      await insertAncestor({
        id: generateId(),
        full_name: fullName.trim(),
        family_rank: familyRank || 'Khác',
        death_day_lunar: day,
        death_month_lunar: month,
        death_year_lunar: year,
        death_is_leap_month: 0,
        death_day_solar: solar.day,
        death_month_solar: solar.month,
        death_year_solar: solar.year,
        burial_place: burialPlace.trim(),
        photo_uri: photoUri,
        notes: notes.trim(),
      });

      // Recalculate reminders with new ancestor
      recalculateAllReminders().catch(console.error);

      toastRef.current?.show(`Đã lưu hồ sơ ${familyRank} ${fullName}`, 'success');
      setTimeout(() => router.back(), 1200);
    } catch (error) {
      console.error('Error saving ancestor:', error);
      Alert.alert('Lỗi', 'Không thể lưu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Toast ref={toastRef} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.secondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Hủy</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm Gia Tiên</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo */}
        <TouchableOpacity style={styles.photoSection} onPress={pickImage}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.lunarHighlight, borderColor: colors.border }]}>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={[styles.photoText, { color: colors.textSecondary }]}>Thêm ảnh chân dung</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Family Rank */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Thứ bậc *</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowRankPicker(!showRankPicker)}
        >
          <Text style={[styles.inputText, { color: familyRank ? colors.text : colors.textMuted }]}>
            {familyRank || 'Chọn thứ bậc...'}
          </Text>
        </TouchableOpacity>

        {showRankPicker && (
          <View style={[styles.rankPicker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {FAMILY_RANKS.map((rank) => (
              <TouchableOpacity
                key={rank}
                style={[
                  styles.rankOption,
                  familyRank === rank && { backgroundColor: colors.lunarHighlight },
                ]}
                onPress={() => {
                  setFamilyRank(rank);
                  setShowRankPicker(false);
                }}
              >
                <Text style={[styles.rankText, { color: colors.text }]}>{rank}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Full Name */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Họ và tên *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nguyễn Văn A..."
          placeholderTextColor={colors.textMuted}
        />

        {/* Lunar Death Date */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Ngày mất (Âm lịch) *</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={deathDayLunar}
              onChangeText={setDeathDayLunar}
              placeholder="Ngày"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
          <View style={styles.dateField}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={deathMonthLunar}
              onChangeText={setDeathMonthLunar}
              placeholder="Tháng"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
          <View style={[styles.dateField, { flex: 1.5 }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={deathYearLunar}
              onChangeText={setDeathYearLunar}
              placeholder="Năm ÂL"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
        </View>

        {/* Show calculated Solar date */}
        {deathDayLunar && deathMonthLunar && deathYearLunar && (
          <View style={[styles.solarPreview, { backgroundColor: colors.lunarHighlight }]}>
            <Text style={[styles.solarPreviewText, { color: Colors.primary }]}>
              {(() => {
                try {
                  const solar = lunarToSolar(parseInt(deathDayLunar), parseInt(deathMonthLunar), parseInt(deathYearLunar));
                  return solar.day > 0
                    ? `📅 Dương lịch: ${solar.day}/${solar.month}/${solar.year}`
                    : '⚠️ Ngày không hợp lệ';
                } catch {
                  return '⚠️ Ngày không hợp lệ';
                }
              })()}
            </Text>
          </View>
        )}

        {/* Burial Place */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Nơi an táng</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={burialPlace}
          onChangeText={setBurialPlace}
          placeholder="Nghĩa trang, quê hương..."
          placeholderTextColor={colors.textMuted}
        />

        {/* Notes */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Ghi chú</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Ghi chú thêm..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: Colors.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Đang lưu...' : '💾 Lưu hồ sơ'}</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  backBtn: { padding: Spacing.xs },
  backText: { color: '#fff', fontSize: FontSizes.md, fontWeight: '600' },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: '#fff' },
  content: {
    padding: Spacing.lg,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: {
    fontSize: 32,
  },
  photoText: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSizes.md,
  },
  inputText: {
    fontSize: FontSizes.md,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dateField: {
    flex: 1,
  },
  solarPreview: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  solarPreviewText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  rankPicker: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  rankOption: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  rankText: {
    fontSize: FontSizes.sm,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
    minHeight: 100,
  },
  saveButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
});
