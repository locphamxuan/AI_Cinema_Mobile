import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName) {
  return function TabIcon({ color }: { color: string }) {
    return <Ionicons name={name} size={24} color={color} />;
  };
}

export default function TabLayout() {
  const { isDark, colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        // MultiShorts: a floating dark pill; the active tab sits on a darker pill of its own.
        tabBarActiveBackgroundColor: isDark ? '#0B0B0B' : '#F0F0F2',
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          borderWidth: 1,
          borderTopWidth: 1,
          borderRadius: 34,
          height: 68,
          paddingHorizontal: 6,
          paddingTop: 6,
          paddingBottom: 6,
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Platform.OS === 'ios' ? 24 : 14,
          elevation: 6,
        },
        tabBarItemStyle: {
          borderRadius: 28,
          marginHorizontal: 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarIcon: tabIcon('play-circle-outline') }} />
      <Tabs.Screen name="explore" options={{ title: 'Khám phá', tabBarIcon: tabIcon('film-outline') }} />
      <Tabs.Screen name="schedule" options={{ title: 'Lịch chiếu', tabBarIcon: tabIcon('calendar-outline') }} />
      <Tabs.Screen name="vip" options={{ title: 'Gói VIP', href: null }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ', tabBarIcon: tabIcon('person-circle-outline') }} />
    </Tabs>
  );
}
