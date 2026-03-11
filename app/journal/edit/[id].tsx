/**
 * Edit Journal Event Screen — Giỗ Chạp Phase 2.5D
 * Pre-filled form to edit an existing event.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import Toast, { type ToastRef } from '@/components/Toast';
import DatePickerField from '@/components/DatePickerField';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { getEventById, updateEvent, EVENT_TYPES, type JournalEventRow } from '@/lib/db/journal';
import { getAllAncestors, type AncestorRow } from '@/lib/db/database';
import { dateToLunar, formatLunarDate } from '@/lib/lunar/converter';

export default function EditJournalEventScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toastRef = useRef<ToastRef>(null);

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('custom');
  const [dateStr, setDateStr] = useState('');
  const [ancestorId, setAncestorId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [ancestors, setAncestors] = useState<AncestorRow[]>([]);
  const [showAncestorPicker, setShowAncestorPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      id ? getEventById(id) : null,
      getAllAncestors(),
    ]).then(([event, ancs]) => {
      if (!event) { router.back(); return; }
      setTitle(event.title);
      setEventType(event.event_type);
      setDateStr(event.event_date_solar);
      setAncestorId(event.ancestor_id);
      setNotes(event.notes);
      setAncestors(ancs);
      setLoading(false);
    }).catch(console.error);
  }, [id]);

  const getLunarDateStr = () => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const lunar = dateToLunar(new Date(y, m - 1, d));
      return formatLunarDate(lunar);
    } catch { return ''; }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề');
      return;
    }

    setSaving(true);
    try {
      const event = await getEventById(id!);
      if (!event) return;

      await updateEvent({
        ...event,
        title: title.trim(),
        event_type: eventType,
        event_date_solar: dateStr,
        event_date_lunar: getLunarDateStr(),
        ancestor_id: ancestorId,
        notes: notes.trim(),
      });

      toastRef.current?.show('Đã cập nhật ghi chép', 'success');
      setTimeout(() => router.back(), 1200);
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật');
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

  const selectedAncestor = ancestors.find(a => a.id === ancestorId);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast ref={toastRef} />
      <View style={[styles.header, { backgroundColor: Colors.secondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Hủy</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sửa ghi chép</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Event Type */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Loại sự kiện</Text>
        <View style={styles.typeGrid}>
          {Object.entries(EVENT_TYPES).map(([key, val]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.typeChip,
                { borderColor: colors.border },
                eventType === key && [styles.typeChipActive, { backgroundColor: Colors.primary, borderColor: Colors.primary }],
              ]}
              onPress={() => setEventType(key)}
            >
              <Text style={styles.typeChipIcon}>{val.icon}</Text>
              <Text style={[
                styles.typeChipText,
                { color: colors.textSecondary },
                eventType === key && { color: '#fff' },
              ]}>{val.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Tiêu đề *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Tiêu đề sự kiện"
          placeholderTextColor={colors.textMuted}
        />

        {/* Date */}
        <DatePickerField label="Ngày (Dương lịch) *" value={dateStr} onChange={setDateStr} showLunar={true} />

        {/* Ancestor */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Liên kết Gia tiên</Text>
        <TouchableOpacity
          style={[styles.input, styles.pickerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowAncestorPicker(!showAncestorPicker)}
        >
          <Text style={{ color: selectedAncestor ? colors.text : colors.textMuted }}>
            {selectedAncestor ? `🕯️ ${selectedAncestor.family_rank} ${selectedAncestor.full_name}` : 'Chọn gia tiên...'}
          </Text>
        </TouchableOpacity>
        {showAncestorPicker && (
          <View style={[styles.ancestorList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.ancestorItem, { borderBottomColor: colors.borderLight }]}
              onPress={() => { setAncestorId(null); setShowAncestorPicker(false); }}
            >
              <Text style={{ color: colors.textMuted }}>— Không liên kết —</Text>
            </TouchableOpacity>
            {ancestors.map(a => (
              <TouchableOpacity
                key={a.id}
                style={[styles.ancestorItem, { borderBottomColor: colors.borderLight }]}
                onPress={() => { setAncestorId(a.id); setShowAncestorPicker(false); }}
              >
                <Text style={{ color: colors.text }}>🕯️ {a.family_rank} {a.full_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Notes */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Ghi chú</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Ghi chú..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: Colors.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxl * 2 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  content: { padding: Spacing.lg },
  label: {
    fontSize: FontSizes.sm, fontWeight: '600',
    marginTop: Spacing.md, marginBottom: Spacing.xs,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pickerBtn: { justifyContent: 'center' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  typeChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1, gap: 4,
  },
  typeChipActive: {},
  typeChipIcon: { fontSize: 14 },
  typeChipText: { fontSize: FontSizes.sm, fontWeight: '600' },
  ancestorList: {
    borderWidth: 1, borderRadius: BorderRadius.md,
    marginTop: Spacing.xs, maxHeight: 200,
  },
  ancestorItem: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    marginTop: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '700' },
});
