import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { HapticTab } from '@/components/haptic-tab';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? Colors.dark.surface : Colors.light.surface,
          borderTopColor: colors.border,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            },
            android: { elevation: 8 },
            default: {},
          }),
        },
        headerShown: false,
        ...(Platform.OS !== 'web' ? { tabBarButton: HapticTab } : {}),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Lịch',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ancestors"
        options={{
          title: 'Gia tiên',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="prayers"
        options={{
          title: 'Văn khấn',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="gearshape.fill" color={color} />,
        }}
      />
      {/* Hide the explore tab from default template */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
