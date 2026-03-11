/**
 * New Journal Event Screen — Giỗ Chạp Phase 2
 * Create a new ritual event entry.
 */

import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { insertEvent, EVENT_TYPES, generateId } from '@/lib/db/journal';
import { getAllAncestors, type AncestorRow } from '@/lib/db/database';
import { dateToLunar, formatLunarDate } from '@/lib/lunar/converter';

export default function NewJournalEventScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('custom');
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [ancestorId, setAncestorId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [ancestors, setAncestors] = useState<AncestorRow[]>([]);
  const [showAncestorPicker, setShowAncestorPicker] = useState(false);

  useEffect(() => {
    getAllAncestors().then(setAncestors).catch(console.error);
  }, []);

  // Auto-suggest title when event type or ancestor changes
  useEffect(() => {
    const type = EVENT_TYPES[eventType];
    const ancestor = ancestors.find(a => a.id === ancestorId);
    if (ancestor && eventType === 'gio') {
      setTitle(`Giỗ ${ancestor.family_rank} ${ancestor.full_name}`);
    } else if (type && eventType !== 'custom') {
      const [y] = dateStr.split('-');
      setTitle(`${type.label} ${y}`);
    }
  }, [eventType, ancestorId, dateStr]);

  const getLunarDateStr = () => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const lunar = dateToLunar(new Date(y, m - 1, d));
      return formatLunarDate(lunar);
    } catch {
      return '';
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề sự kiện');
      return;
    }
    if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Lỗi', 'Ngày không hợp lệ (định dạng YYYY-MM-DD)');
      return;
    }

    try {
      const id = generateId();
      await insertEvent({
        id,
        title: title.trim(),
        event_type: eventType,
        event_date_solar: dateStr,
        event_date_lunar: getLunarDateStr(),
        ancestor_id: ancestorId,
        notes: notes.trim(),
      });

      Alert.alert('Thành công', 'Đã tạo ghi chép mới', [
        { text: 'OK', onPress: () => router.replace(`/journal/${id}`) },
      ]);
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Lỗi', 'Không thể lưu sự kiện');
    }
  };

  const selectedAncestor = ancestors.find(a => a.id === ancestorId);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.secondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Hủy</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo ghi chép mới</Text>
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
              ]}>
                {val.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Tiêu đề *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={title}
          onChangeText={setTitle}
          placeholder="VD: Giỗ Ông Nội 2026"
          placeholderTextColor={colors.textMuted}
        />

        {/* Date */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Ngày (Dương lịch) *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={dateStr}
          onChangeText={setDateStr}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
        />
        {dateStr.match(/^\d{4}-\d{2}-\d{2}$/) && (
          <Text style={[styles.lunarHint, { color: Colors.primary }]}>🌙 {getLunarDateStr()}</Text>
        )}

        {/* Linked Ancestor */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Liên kết Gia tiên (tuỳ chọn)</Text>
        <TouchableOpacity
          style={[styles.input, styles.pickerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowAncestorPicker(!showAncestorPicker)}
        >
          <Text style={{ color: selectedAncestor ? colors.text : colors.textMuted }}>
            {selectedAncestor
              ? `🕯️ ${selectedAncestor.family_rank} ${selectedAncestor.full_name}`
              : 'Chọn gia tiên...'}
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
          placeholder="Ghi chú thêm..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: Colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>💾 Tạo sự kiện</Text>
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
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerBtn: {
    justifyContent: 'center',
  },
  lunarHint: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  typeChipActive: {},
  typeChipIcon: { fontSize: 14 },
  typeChipText: { fontSize: FontSizes.sm, fontWeight: '600' },
  ancestorList: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    maxHeight: 200,
  },
  ancestorItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '700' },
});
