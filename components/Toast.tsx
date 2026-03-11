/**
 * Toast Component — Giỗ Chạp
 * Lightweight, animated toast notification.
 * Usage: <Toast ref={toastRef} /> then toastRef.current?.show('message', 'success')
 */

import React, { useState, useCallback, useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';

export interface ToastRef {
  show: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

const TOAST_ICONS = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
};

const TOAST_COLORS = {
  success: Colors.success,
  error: Colors.error,
  info: Colors.primary,
};

const Toast = forwardRef<ToastRef>((_, ref) => {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false });
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
    ]).start(() => setToast(prev => ({ ...prev, visible: false })));
  }, [opacity, translateY]);

  const show = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    setToast({ message, type, visible: true });
    opacity.setValue(0);
    translateY.setValue(20);
    
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(hide, 2500);
  }, [opacity, translateY, hide]);

  useImperativeHandle(ref, () => ({ show }));

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (!toast.visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ translateY }], borderLeftColor: TOAST_COLORS[toast.type] },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.icon}>{TOAST_ICONS[toast.type]}</Text>
      <Text style={styles.message}>{toast.message}</Text>
    </Animated.View>
  );
});

Toast.displayName = 'Toast';

export default Toast;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 100 : 120,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderLeftWidth: 4,
    zIndex: 9999,
    elevation: 10,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    } : {}),
  },
  icon: {
    fontSize: 18,
  },
  message: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
    flex: 1,
  },
});
