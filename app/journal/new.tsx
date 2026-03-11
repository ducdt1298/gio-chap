/**
 * New Journal Event Screen — Giỗ Chạp Phase 2.5E
 * All-in-one form: event details, photos, shopping list in one screen.
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
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { insertEvent, addPhotoToEvent, EVENT_TYPES, generateId } from '@/lib/db/journal';
import { getAllAncestors, type AncestorRow } from '@/lib/db/database';
import { dateToLunar, formatLunarDate } from '@/lib/lunar/converter';

// Shopping item categories
const SHOPPING_CATEGORIES = [
  { key: 'hoa', label: '🌸 Hoa', placeholder: 'Hoa cúc, hoa hồng...' },
  { key: 'traicay', label: '🍎 Trái cây', placeholder: 'Ngũ quả...' },
  { key: 'doma', label: '🏮 Đồ mã', placeholder: 'Vàng mã, quần áo...' },
  { key: 'thucpham', label: '🍖 Thực phẩm', placeholder: 'Gà, xôi, chè...' },
  { key: 'nhang', label: '🕯️ Nhang & Nến', placeholder: 'Nhang trầm, nến...' },
  { key: 'khac', label: '📦 Khác', placeholder: 'Rượu, trà, bánh...' },
];

interface TempShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
}

export default function NewJournalEventScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const toastRef = useRef<ToastRef>(null);

  // Event details
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('custom');
  const [dateStr, setDateStr] = useState(() => {
    if (params.date && params.date.match(/^\d{4}-\d{2}-\d{2}$/)) return params.date;
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [ancestorId, setAncestorId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [ancestors, setAncestors] = useState<AncestorRow[]>([]);
  const [showAncestorPicker, setShowAncestorPicker] = useState(false);

  // Inline photos (temp URIs before save)
  const [tempPhotos, setTempPhotos] = useState<string[]>([]);

  // Inline shopping list
  const [shoppingItems, setShoppingItems] = useState<TempShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('khac');
  const [showShoppingForm, setShowShoppingForm] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllAncestors().then(setAncestors).catch(console.error);
  }, []);

  // Auto-suggest title
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
    } catch { return ''; }
  };

  const handlePickPhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
      });
      if (!result.canceled && result.assets) {
        setTempPhotos(prev => [...prev, ...result.assets.map(a => a.uri)]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const removePhoto = (index: number) => {
    setTempPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const addShoppingItem = () => {
    if (!newItemName.trim()) return;
    setShoppingItems(prev => [...prev, {
      id: generateId(),
      name: newItemName.trim(),
      quantity: newItemQty.trim() || '1',
      category: newItemCategory,
    }]);
    setNewItemName('');
    setNewItemQty('');
  };

  const removeShoppingItem = (id: string) => {
    setShoppingItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề sự kiện');
      return;
    }

    setSaving(true);
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

      // Save photos
      for (const uri of tempPhotos) {
        await addPhotoToEvent(id, uri);
      }

      // TODO: Save shopping items when shopping CRUD is built in Phase 2B

      toastRef.current?.show('Đã tạo ghi chép mới', 'success');
      setTimeout(() => router.replace(`/journal/${id}`), 1200);
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Lỗi', 'Không thể lưu sự kiện');
    } finally {
      setSaving(false);
    }
  };

  const selectedAncestor = ancestors.find(a => a.id === ancestorId);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast ref={toastRef} />
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

        {/* Date — DatePicker */}
        <DatePickerField
          label="Ngày (Dương lịch) *"
          value={dateStr}
          onChange={setDateStr}
          showLunar={true}
        />

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

        {/* ===== INLINE PHOTOS ===== */}
        <View style={[styles.sectionDivider, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📸 Ảnh mâm cúng</Text>
        </View>
        {tempPhotos.length > 0 && (
          <View style={styles.photoGrid}>
            {tempPhotos.map((uri, idx) => (
              <View key={idx} style={styles.photoItem}>
                <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
                <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(idx)}>
                  <Text style={styles.photoRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity
          style={[styles.addMediaBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handlePickPhotos}
        >
          <Text style={[styles.addMediaBtnText, { color: Colors.primary }]}>📷 Chọn ảnh ({tempPhotos.length})</Text>
        </TouchableOpacity>

        {/* ===== INLINE SHOPPING LIST ===== */}
        <View style={[styles.sectionDivider, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🛒 Danh sách đồ cúng</Text>
        </View>
        {shoppingItems.length > 0 && (
          <View style={[styles.shoppingList, { borderColor: colors.border }]}>
            {shoppingItems.map(item => {
              const cat = SHOPPING_CATEGORIES.find(c => c.key === item.category);
              return (
                <View key={item.id} style={[styles.shoppingItem, { borderBottomColor: colors.borderLight }]}>
                  <Text style={[styles.shoppingItemText, { color: colors.text }]}>
                    {cat?.label.split(' ')[0]} {item.name}
                  </Text>
                  <Text style={[styles.shoppingItemQty, { color: colors.textMuted }]}>x{item.quantity}</Text>
                  <TouchableOpacity onPress={() => removeShoppingItem(item.id)}>
                    <Text style={{ color: Colors.error, fontSize: 16 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {showShoppingForm ? (
          <View style={[styles.shoppingForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Category chips */}
            <View style={styles.catGrid}>
              {SHOPPING_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.catChip,
                    { borderColor: colors.border },
                    newItemCategory === cat.key && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                  ]}
                  onPress={() => setNewItemCategory(cat.key)}
                >
                  <Text style={[
                    { fontSize: 12, color: colors.textSecondary },
                    newItemCategory === cat.key && { color: '#fff' },
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.shoppingInputRow}>
              <TextInput
                style={[styles.shoppingInput, { flex: 2, backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={newItemName}
                onChangeText={setNewItemName}
                placeholder="Tên đồ..."
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.shoppingInput, { flex: 0.7, backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={newItemQty}
                onChangeText={setNewItemQty}
                placeholder="SL"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[styles.shoppingAddBtn, { backgroundColor: Colors.primary }]}
                onPress={addShoppingItem}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addMediaBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowShoppingForm(true)}
          >
            <Text style={[styles.addMediaBtnText, { color: Colors.primary }]}>➕ Thêm đồ cúng ({shoppingItems.length})</Text>
          </TouchableOpacity>
        )}

        {/* Notes */}
        <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.lg }]}>Ghi chú</Text>
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
          style={[styles.saveBtn, { backgroundColor: Colors.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : '💾 Tạo sự kiện'}</Text>
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

  // Section divider
  sectionDivider: {
    borderTopWidth: 1, marginTop: Spacing.lg, paddingTop: Spacing.md,
  },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '700', marginBottom: Spacing.sm },

  // Photos
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  photoItem: { width: '30%', aspectRatio: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', width: 24, height: 24,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  addMediaBtn: {
    borderWidth: 1, borderStyle: 'dashed', borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  addMediaBtnText: { fontWeight: '600', fontSize: FontSizes.md },

  // Shopping
  shoppingList: { borderWidth: 1, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  shoppingItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: Spacing.sm,
  },
  shoppingItemText: { flex: 1, fontSize: FontSizes.md },
  shoppingItemQty: { fontSize: FontSizes.sm, fontWeight: '600' },
  shoppingForm: {
    borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: Spacing.sm },
  catChip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  shoppingInputRow: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  shoppingInput: {
    borderWidth: 1, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    fontSize: FontSizes.sm,
  },
  shoppingAddBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },

  // Save
  saveBtn: {
    marginTop: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '700' },
});
