import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getDatabase, seedDefaultPrayers } from '@/lib/db/database';
import { initReminders, recalculateAllReminders } from '@/lib/notifications/scheduler';

// Custom navigation themes matching our Vietnamese spiritual aesthetic
const GioChapLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.secondary,
  },
};

const GioChapDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primary,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.secondaryLight,
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Initialize database, seed data, and set up reminders on app start
  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        await seedDefaultPrayers();
        // Initialize notification system
        await initReminders();
        // Schedule all reminders (Rằm/Mùng 1 + death anniversaries)
        await recalculateAllReminders();
      } catch (error) {
        console.error('App initialization error:', error);
      }
    }
    init();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? GioChapDarkTheme : GioChapLightTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="ancestor/new" options={{ headerShown: false }} />
        <Stack.Screen name="ancestor/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="ancestor/edit/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="journal/index" options={{ headerShown: false }} />
        <Stack.Screen name="journal/new" options={{ headerShown: false }} />
        <Stack.Screen name="journal/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="journal/edit/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="prayer/[id]"
          options={{
            title: 'Văn Khấn',
            headerStyle: { backgroundColor: colorScheme === 'dark' ? Colors.dark.surface : Colors.light.headerBackground },
            headerTintColor: Colors.light.headerText,
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
