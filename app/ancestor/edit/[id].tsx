/**
 * Edit Ancestor Screen — Giỗ Chạp Phase 2.5C
 * Pre-filled form to edit an existing ancestor profile.
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import Toast, { type ToastRef } from '@/components/Toast';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { getAncestorById, updateAncestor, type AncestorRow } from '@/lib/db/database';
import { lunarToSolar } from '@/lib/lunar/converter';
import { recalculateAllReminders } from '@/lib/notifications/scheduler';

const FAMILY_RANKS = [
  'Ông nội', 'Bà nội', 'Ông ngoại', 'Bà ngoại',
  'Cha', 'Mẹ', 'Bác', 'Chú', 'Cậu', 'Dì', 'Cô',
  'Anh', 'Chị', 'Em', 'Con', 'Cháu', 'Khác',
];

export default function EditAncestorScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toastRef = useRef<ToastRef>(null);

  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!id) return;
    getAncestorById(id).then((anc) => {
      if (!anc) { router.back(); return; }
      setFullName(anc.full_name);
      setFamilyRank(anc.family_rank);
      setDeathDayLunar(String(anc.death_day_lunar));
      setDeathMonthLunar(String(anc.death_month_lunar));
      setDeathYearLunar(String(anc.death_year_lunar));
      setBurialPlace(anc.burial_place || '');
      setNotes(anc.notes || '');
      setPhotoUri(anc.photo_uri);
      setLoading(false);
    }).catch(console.error);
  }, [id]);

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
      Alert.alert('Ngày không hợp lệ', 'Vui lòng nhập ngày mất Âm lịch hợp lệ.');
      return;
    }

    setSaving(true);
    try {
      const solar = lunarToSolar(day, month, year, false);

      await updateAncestor({
        id: id!,
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

      recalculateAllReminders().catch(console.error);
      toastRef.current?.show('Đã cập nhật thông tin', 'success');
      setTimeout(() => router.back(), 1200);
    } catch (error) {
      console.error('Error updating ancestor:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>  
        <Text style={{ color: colors.textSecondary }}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Toast ref={toastRef} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: Colors.secondary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sửa thông tin gia tiên</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Photo */}
        <TouchableOpacity style={styles.photoSection} onPress={pickImage}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.photoPlaceholderText}>📷 Chọn ảnh</Text>
            </View>
          )}
          <Text style={[styles.photoHint, { color: colors.textMuted }]}>Chạm để đổi ảnh</Text>
        </TouchableOpacity>

        {/* Family Rank */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Vai vế trong gia đình *</Text>
        <TouchableOpacity
          style={[styles.input, styles.pickerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowRankPicker(!showRankPicker)}
        >
          <Text style={{ color: familyRank ? colors.text : colors.textMuted }}>
            {familyRank || 'Chọn vai vế...'}
          </Text>
        </TouchableOpacity>
        {showRankPicker && (
          <View style={[styles.rankList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {FAMILY_RANKS.map(rank => (
              <TouchableOpacity
                key={rank}
                style={[styles.rankItem, { borderBottomColor: colors.borderLight },
                  familyRank === rank && { backgroundColor: colors.lunarHighlight }]}
                onPress={() => { setFamilyRank(rank); setShowRankPicker(false); }}
              >
                <Text style={{ color: colors.text }}>{rank}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Full Name */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Họ và tên *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nguyễn Văn A"
          placeholderTextColor={colors.textMuted}
        />

        {/* Death Date Lunar */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Ngày mất (Âm lịch) *</Text>
        <View style={styles.dateRow}>
          <TextInput
            style={[styles.dateInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={deathDayLunar}
            onChangeText={setDeathDayLunar}
            placeholder="Ngày"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.dateInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={deathMonthLunar}
            onChangeText={setDeathMonthLunar}
            placeholder="Tháng"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.dateInput, { flex: 1.5, backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={deathYearLunar}
            onChangeText={setDeathYearLunar}
            placeholder="Năm ÂL"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </View>

        {/* Burial Place */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Nơi an táng</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={burialPlace}
          onChangeText={setBurialPlace}
          placeholder="Nghĩa trang..."
          placeholderTextColor={colors.textMuted}
        />

        {/* Notes */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Ghi chú</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Ghi chú thêm..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: Colors.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxl * 2 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: Spacing.xl },
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
  photoSection: { alignItems: 'center', marginVertical: Spacing.lg },
  photo: { width: 100, height: 100, borderRadius: 50 },
  photoPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  photoPlaceholderText: { fontSize: FontSizes.sm },
  photoHint: { fontSize: FontSizes.sm, marginTop: Spacing.xs },
  label: {
    fontSize: FontSizes.sm, fontWeight: '600',
    marginTop: Spacing.md, marginBottom: Spacing.xs,
    marginHorizontal: Spacing.lg,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSizes.md, marginHorizontal: Spacing.lg,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickerBtn: { justifyContent: 'center' },
  dateRow: {
    flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Spacing.lg,
  },
  dateInput: {
    flex: 1, borderWidth: 1, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSizes.md, textAlign: 'center',
  },
  rankList: {
    borderWidth: 1, borderRadius: BorderRadius.md,
    marginTop: Spacing.xs, maxHeight: 200,
    marginHorizontal: Spacing.lg,
  },
  rankItem: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    marginTop: Spacing.xl, marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '700' },
});
