/**
 * Settings Screen — Giỗ Chạp
 * Configure homeowner name, address, theme, and notification preferences.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import Toast, { type ToastRef } from '@/components/Toast';
import { useFocusEffect } from '@react-navigation/native';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { getSetting, setSetting } from '@/lib/db/database';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
} from '@/lib/notifications/provider';
import {
  recalculateAllReminders,
  getReminderSummary,
} from '@/lib/notifications/scheduler';

export default function SettingsScreen() {
  const colors = useThemeColors();

  const [homeownerName, setHomeownerName] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [advanceDays, setAdvanceDays] = useState('3');
  const [saved, setSaved] = useState(false);
  const toastRef = useRef<ToastRef>(null);
  const [loading, setLoading] = useState(true);

  // Notification state
  const [notifPermission, setNotifPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [reminderSummary, setReminderSummary] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [scheduleResult, setScheduleResult] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      loadNotificationStatus();
    }, [])
  );

  const loadSettings = async () => {
    try {
      const name = await getSetting('homeownerName');
      const address = await getSetting('homeAddress');
      const days = await getSetting('reminderAdvanceDays');

      if (name) setHomeownerName(name);
      if (address) setHomeAddress(address);
      if (days) setAdvanceDays(days);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationStatus = async () => {
    try {
      const status = await getNotificationPermissionStatus();
      setNotifPermission(status);
      const summary = await getReminderSummary();
      setReminderSummary(summary);
    } catch (error) {
      console.error('Error loading notification status:', error);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    if (granted) {
      handleRecalculate();
    }
  };

  const handleRecalculate = async () => {
    setScheduling(true);
    setScheduleResult('');
    try {
      const result = await recalculateAllReminders();
      setScheduleResult(`✅ Đã lên lịch ${result.scheduled} nhắc nhở`);
      const summary = await getReminderSummary();
      setReminderSummary(summary);
    } catch (error) {
      setScheduleResult('❌ Lỗi khi lên lịch nhắc nhở');
    } finally {
      setScheduling(false);
      setTimeout(() => setScheduleResult(''), 3000);
    }
  };

  const handleSave = async () => {
    try {
      await setSetting('homeownerName', homeownerName.trim());
      await setSetting('homeAddress', homeAddress.trim());
      await setSetting('reminderAdvanceDays', advanceDays);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toastRef.current?.show('Đã lưu cài đặt thành công', 'success');

      // Recalculate reminders with new advance days
      if (notifPermission === 'granted') {
        handleRecalculate();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Lỗi', 'Không thể lưu cài đặt. Vui lòng thử lại.');
    }
  };

  const advanceDaysOptions = ['1', '3', '5', '7'];

  const permissionLabel = notifPermission === 'granted'
    ? '✅ Đã bật'
    : notifPermission === 'denied'
    ? '❌ Bị từ chối'
    : '⏳ Chưa cấp quyền';

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: Colors.secondary }]}>
          <Text style={styles.headerTitle}>⚙️ Cài đặt</Text>
        </View>
        <View style={styles.loadingState}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast ref={toastRef} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.secondary }]}>
        <Text style={styles.headerTitle}>⚙️ Cài đặt</Text>
        <Text style={styles.headerSubtitle}>Tùy chỉnh thông tin gia chủ và ứng dụng</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Homeowner Info Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>👤 Thông tin Gia chủ</Text>
          <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
            Thông tin này sẽ tự động được điền vào các bài văn khấn
          </Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Tên gia chủ</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
            value={homeownerName}
            onChangeText={setHomeownerName}
            placeholder="Nguyễn Văn A"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Địa chỉ</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
            value={homeAddress}
            onChangeText={setHomeAddress}
            placeholder="Số nhà, đường/phố, phường/xã, quận/huyện, tỉnh/TP"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        {/* Notification Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔔 Nhắc nhở</Text>

          {/* Permission Status */}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Quyền thông báo</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{permissionLabel}</Text>
          </View>

          {notifPermission !== 'granted' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.warning }]}
              onPress={handleRequestPermission}
            >
              <Text style={styles.actionButtonText}>🔔 Bật thông báo</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.sectionDesc, { color: colors.textMuted, marginTop: Spacing.md }]}>
            Nhắc trước bao nhiêu ngày khi đến ngày Giỗ
          </Text>

          <View style={styles.optionsRow}>
            {advanceDaysOptions.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: advanceDays === day ? Colors.primary : colors.backgroundSecondary,
                    borderColor: advanceDays === day ? Colors.primary : colors.border,
                  },
                ]}
                onPress={() => setAdvanceDays(day)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: advanceDays === day ? '#fff' : colors.text },
                  ]}
                >
                  {day} ngày
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reminder Summary */}
          {reminderSummary ? (
            <View style={[styles.summaryBox, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {reminderSummary}
              </Text>
            </View>
          ) : null}

          {/* Recalculate Button */}
          {notifPermission === 'granted' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.primary, opacity: scheduling ? 0.6 : 1 }]}
              onPress={handleRecalculate}
              disabled={scheduling}
            >
              <Text style={styles.actionButtonText}>
                {scheduling ? '⏳ Đang lên lịch...' : '🔄 Cập nhật nhắc nhở'}
              </Text>
            </TouchableOpacity>
          )}

          {scheduleResult ? (
            <Text style={[styles.scheduleResult, { color: colors.text }]}>{scheduleResult}</Text>
          ) : null}
        </View>

        {/* App Info Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ℹ️ Thông tin ứng dụng</Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phiên bản</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0 (Phase 1)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Platform</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{Platform.OS}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Engine</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>Hồ Ngọc Đức (UTC+7)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Database</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {Platform.OS === 'web' ? 'localStorage' : 'SQLite'}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: saved ? Colors.success : Colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>
            {saved ? '✓ Đã lưu thành công!' : '💾 Lưu cài đặt'}
          </Text>
        </TouchableOpacity>

        {/* Credits */}
        <View style={styles.credits}>
          <Text style={[styles.creditsText, { color: colors.textMuted }]}>
            🙏 Giỗ Chạp — Quản lý Tâm linh & Gia phả số
          </Text>
          <Text style={[styles.creditsText, { color: colors.textMuted }]}>
            Lịch Âm Dương chính xác cho Việt Nam
          </Text>
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
  content: {
    padding: Spacing.md,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FontSizes.md,
  },
  section: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  sectionDesc: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSizes.md,
  },
  textArea: {
    minHeight: 60,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  optionChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  optionText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: FontSizes.md,
  },
  infoValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  actionButton: {
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  summaryBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  summaryText: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  scheduleResult: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  credits: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: Spacing.xs,
  },
  creditsText: {
    fontSize: FontSizes.sm,
  },
});
