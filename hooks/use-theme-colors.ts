import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Returns the current theme's color palette based on system/user preference.
 */
export function useThemeColors(): ThemeColors {
  const colorScheme = useColorScheme();
  return Colors[colorScheme ?? 'light'];
}
