/**
 * Giỗ Chạp — Theme System
 * Vietnamese spiritual aesthetic: warm golds, deep reds, rosewood browns
 */

import { Platform } from 'react-native';

export const Colors = {
  // === Brand Colors (shared) ===
  primary: '#C8923C',       // Warm gold - main accent
  primaryLight: '#E5B968',
  primaryDark: '#9E6F2A',
  secondary: '#8B2E2E',     // Deep red - ritual/spiritual
  secondaryLight: '#B54545',
  accent: '#D4A76A',        // Amber gold
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#E53935',

  // === Light Mode ===
  light: {
    text: '#1A1A1A',
    textSecondary: '#5C5C5C',
    textMuted: '#8A8A8A',
    background: '#FBF8F3',       // Warm parchment 
    backgroundSecondary: '#F3EDE3',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E5DDD0',
    borderLight: '#F0EBE3',
    tint: '#C8923C',
    icon: '#6B5E50',
    tabIconDefault: '#9E9589',
    tabIconSelected: '#C8923C',
    cardBackground: '#FFFFFF',
    headerBackground: '#8B2E2E',
    headerText: '#FFFFFF',
    lunarHighlight: '#FFF3E0',
    anniversaryBadge: '#C8923C',
    ramMungBadge: '#8B2E2E',
  },

  // === Dark Mode ===
  dark: {
    text: '#F5F0E8',
    textSecondary: '#C4B9A8',
    textMuted: '#8A7F72',
    background: '#1A1512',       // Deep rosewood
    backgroundSecondary: '#24201A',
    surface: '#2C261F',
    surfaceElevated: '#342E26',
    border: '#3D362D',
    borderLight: '#342E26',
    tint: '#E5B968',
    icon: '#A89880',
    tabIconDefault: '#7A7068',
    tabIconSelected: '#E5B968',
    cardBackground: '#2C261F',
    headerBackground: '#24201A',
    headerText: '#F5F0E8',
    lunarHighlight: '#3D2E1A',
    anniversaryBadge: '#E5B968',
    ramMungBadge: '#B54545',
  },
};

export type ThemeColors = typeof Colors.light;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  xxxl: 34,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'System',
    mono: 'Menlo',
  },
  android: {
    sans: 'Roboto',
    serif: 'serif',
    rounded: 'Roboto',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    serif: 'serif',
    rounded: 'System',
    mono: 'monospace',
  },
  web: {
    sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', system-ui, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});

export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    android: { elevation: 3 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    default: {},
  }),
};
