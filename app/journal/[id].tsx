/**
 * Journal Event Detail Screen — Giỗ Chạp Phase 2
 * View event details, photos, shopping list summary, and notes.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '@/constants/theme';
import Toast, { type ToastRef } from '@/components/Toast';
import {
  getEventById, updateEvent, deleteEvent, getPhotosForEvent,
  addPhotoToEvent, removePhoto, EVENT_TYPES,
  type JournalEventRow, type JournalPhotoRow,
} from '@/lib/db/journal';
import { getAncestorById, type AncestorRow } from '@/lib/db/database';

export default function JournalEventDetailScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [event, setEvent] = useState<JournalEventRow | null>(null);
  const [photos, setPhotos] = useState<JournalPhotoRow[]>([]);
  const [ancestor, setAncestor] = useState<AncestorRow | null>(null);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<JournalPhotoRow | null>(null);
  const toastRef = useRef<ToastRef>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const ev = await getEventById(id);
      if (!ev) return;
      setEvent(ev);
      setNotes(ev.notes);

      const ph = await getPhotosForEvent(id);
      setPhotos(ph);

      if (ev.ancestor_id) {
        const anc = await getAncestorById(ev.ancestor_id);
        setAncestor(anc);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        for (const asset of result.assets) {
          await addPhotoToEvent(id!, asset.uri);
        }
        const updated = await getPhotosForEvent(id!);
        setPhotos(updated);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    Alert.alert('Xóa ảnh', 'Bạn có chắc muốn xóa ảnh này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          await removePhoto(photoId);
          setPhotos(prev => prev.filter(p => p.id !== photoId));
          setSelectedPhoto(null);
          toastRef.current?.show('Đã xóa ảnh', 'success');
        },
      },
    ]);
  };

  const handleSaveNotes = async () => {
    if (!event) return;
    try {
      await updateEvent({ ...event, notes: notes.trim() });
      setEvent({ ...event, notes: notes.trim() });
      setEditingNotes(false);
      toastRef.current?.show('Đã lưu ghi chú', 'success');
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const handleDeleteEvent = () => {
    if (!event) return;
    Alert.alert('Xóa sự kiện', `Bạn có chắc muốn xóa "${event.title}"? Tất cả ảnh và danh sách đồ lễ sẽ bị xóa.`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          await deleteEvent(event.id);
          toastRef.current?.show('Đã xóa sự kiện', 'success');
          setTimeout(() => router.back(), 1000);
        },
      },
    ]);
  };

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải...</Text>
      </View>
    );
  }

  const eventType = EVENT_TYPES[event.event_type] || EVENT_TYPES.custom;
  const formatDate = (d: string) => { const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };
  const formatExpense = (n: number) => n ? n.toLocaleString('vi-VN') + 'đ' : '0đ';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast ref={toastRef} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.secondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Về</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => router.push(`/journal/edit/${id}`)}>
            <Text style={styles.deleteText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteEvent}>
            <Text style={styles.deleteText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Event Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }, Shadows.sm]}>
          <View style={[styles.eventBadge, { backgroundColor: colors.lunarHighlight }]}>
            <Text>{eventType.icon} {eventType.label}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>📅 Ngày:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {formatDate(event.event_date_solar)}
              {event.event_date_lunar ? ` (${event.event_date_lunar})` : ''}
            </Text>
          </View>
          {ancestor && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>🕯️ Gia tiên:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {ancestor.family_rank} {ancestor.full_name}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>💰 Chi tiêu:</Text>
            <Text style={[styles.infoValue, { color: Colors.primary, fontWeight: '700' }]}>
              {formatExpense(event.total_expense)}
            </Text>
          </View>
        </View>

        {/* Photo Gallery */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📸 Ảnh mâm cúng ({photos.length})</Text>
            <TouchableOpacity
              style={[styles.addPhotoBtn, { backgroundColor: Colors.primary }]}
              onPress={handlePickImage}
            >
              <Text style={styles.addPhotoBtnText}>+ Thêm ảnh</Text>
            </TouchableOpacity>
          </View>

          {photos.length === 0 ? (
            <TouchableOpacity
              style={[styles.photoEmpty, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handlePickImage}
            >
              <Text style={styles.photoEmptyIcon}>📷</Text>
              <Text style={[styles.photoEmptyText, { color: colors.textMuted }]}>
                Chạm để thêm ảnh mâm cúng
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.photoGrid}>
              {photos.map(photo => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoItem}
                  onPress={() => setSelectedPhoto(photo)}
                >
                  <Image source={{ uri: photo.photo_uri }} style={styles.photoImage} contentFit="cover" />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.photoAddMore, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handlePickImage}
              >
                <Text style={styles.photoAddMoreIcon}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Shopping List Quick View */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🛒 Danh sách đồ lễ</Text>
            <TouchableOpacity
              style={[styles.viewAllBtn, { borderColor: Colors.primary }]}
              onPress={() => router.push(`/journal/${id}/shopping`)}
            >
              <Text style={[styles.viewAllText, { color: Colors.primary }]}>Chi tiết →</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.shoppingPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push(`/journal/${id}/shopping`)}
          >
            <Text style={[styles.shoppingPreviewText, { color: colors.textMuted }]}>
              Chạm để quản lý danh sách đồ lễ
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📝 Ghi chú</Text>
            {!editingNotes && (
              <TouchableOpacity onPress={() => setEditingNotes(true)}>
                <Text style={[styles.editBtn, { color: Colors.primary }]}>Sửa</Text>
              </TouchableOpacity>
            )}
          </View>
          {editingNotes ? (
            <View>
              <TextInput
                style={[styles.notesInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={5}
                placeholder="Ghi chú thêm về sự kiện..."
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.notesActions}>
                <TouchableOpacity
                  style={[styles.notesSaveBtn, { backgroundColor: Colors.primary }]}
                  onPress={handleSaveNotes}
                >
                  <Text style={styles.notesSaveBtnText}>💾 Lưu</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setNotes(event.notes); setEditingNotes(false); }}>
                  <Text style={[styles.notesCancelBtn, { color: colors.textMuted }]}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.notesBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.notesText, { color: notes ? colors.text : colors.textMuted }]}>
                {notes || 'Chưa có ghi chú'}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: Spacing.xxl * 2 }} />
      </ScrollView>

      {/* Photo Viewer Modal */}
      <Modal visible={!!selectedPhoto} animationType="fade" transparent>
        <View style={styles.photoModal}>
          {selectedPhoto && (
            <>
              <Image source={{ uri: selectedPhoto.photo_uri }} style={styles.photoModalImage} contentFit="contain" />
              <View style={styles.photoModalActions}>
                <TouchableOpacity
                  style={[styles.photoModalBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                  onPress={() => setSelectedPhoto(null)}
                >
                  <Text style={styles.photoModalBtnText}>✕ Đóng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoModalBtn, { backgroundColor: Colors.error }]}
                  onPress={() => handleRemovePhoto(selectedPhoto.id)}
                >
                  <Text style={styles.photoModalBtnText}>🗑️ Xóa</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingText: { textAlign: 'center', marginTop: 100, fontSize: FontSizes.md },
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
  headerTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: '#fff', flex: 1, textAlign: 'center', marginHorizontal: Spacing.sm },
  deleteText: { fontSize: 20 },
  content: { padding: Spacing.md },

  // Info Card
  infoCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  eventBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  infoLabel: { fontSize: FontSizes.md, width: 100 },
  infoValue: { fontSize: FontSizes.md, flex: 1, fontWeight: '500' },

  // Section
  section: { marginTop: Spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '700' },

  // Photos
  addPhotoBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  addPhotoBtnText: { color: '#fff', fontSize: FontSizes.sm, fontWeight: '600' },
  photoEmpty: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  photoEmptyIcon: { fontSize: 40, marginBottom: Spacing.sm },
  photoEmptyText: { fontSize: FontSizes.md },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  photoItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  photoAddMore: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddMoreIcon: { fontSize: 32, color: '#aaa' },

  // Shopping
  viewAllBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  viewAllText: { fontSize: FontSizes.sm, fontWeight: '600' },
  shoppingPreview: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  shoppingPreviewText: { fontSize: FontSizes.md },

  // Notes
  editBtn: { fontSize: FontSizes.md, fontWeight: '600' },
  notesBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 80,
  },
  notesText: { fontSize: FontSizes.md, lineHeight: 24 },
  notesInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  notesActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  notesSaveBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  notesSaveBtnText: { color: '#fff', fontWeight: '700' },
  notesCancelBtn: { fontSize: FontSizes.md },

  // Photo Modal
  photoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalImage: {
    width: '90%',
    height: '70%',
  },
  photoModalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  photoModalBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  photoModalBtnText: { color: '#fff', fontSize: FontSizes.md, fontWeight: '700' },
});
