/**
 * DatePicker Modal — Giỗ Chạp
 * Cross-platform date picker: native HTML date input on web.
 * Shows lunar date preview below.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  TextInput,
} from 'react-native';

import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { dateToLunar, formatLunarDate } from '@/lib/lunar/converter';

interface DatePickerFieldProps {
  value: string;           // YYYY-MM-DD
  onChange: (val: string) => void;
  label?: string;
  showLunar?: boolean;
}

export default function DatePickerField({ value, onChange, label, showLunar = true }: DatePickerFieldProps) {
  const colors = useThemeColors();

  const getLunarStr = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return '';
      const lunar = dateToLunar(new Date(y, m - 1, d));
      return formatLunarDate(lunar);
    } catch {
      return '';
    }
  };

  const formatDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
        <input
          type="date"
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 16,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            backgroundColor: colors.surface,
            color: colors.text,
            fontFamily: 'inherit',
            boxSizing: 'border-box' as any,
            outline: 'none',
          }}
        />
        {showLunar && value && (
          <Text style={[styles.lunarHint, { color: Colors.primary }]}>🌙 {getLunarStr(value)}</Text>
        )}
      </View>
    );
  }

  // Native fallback: TextInput with format hint
  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
      />
      {showLunar && value.match(/^\d{4}-\d{2}-\d{2}$/) && (
        <Text style={[styles.lunarHint, { color: Colors.primary }]}>🌙 {getLunarStr(value)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
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
  lunarHint: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
