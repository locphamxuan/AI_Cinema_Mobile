import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts, useTheme } from '../../src/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Outline icon at rest, the filled one when the tab is open. */
function tabIcon(name: IconName, active: IconName) {
  return function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return <Ionicons name={focused ? active : name} size={23} color={color} />;
  };
}

export default function TabLayout() {
  const { isDark, colors } = useTheme();

  return (
    <Tabs
      // Gói Tháng is opened from Hồ sơ or the unlock dialog; its back button returns there.
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        // A floating pill; the open tab sits on a darker pill of its own.
        tabBarActiveBackgroundColor: colors.tabBarActiveBg,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.border,
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
          fontFamily: fonts.semibold,
          fontSize: 12,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarIcon: tabIcon('play-circle-outline', 'play-circle') }} />
      <Tabs.Screen name="explore" options={{ title: 'Khám phá', tabBarIcon: tabIcon('compass-outline', 'compass') }} />
      <Tabs.Screen name="schedule" options={{ title: 'Lịch chiếu', tabBarIcon: tabIcon('calendar-clear-outline', 'calendar-clear') }} />
      <Tabs.Screen name="vip" options={{ title: 'Gói Tháng', href: null }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ', tabBarIcon: tabIcon('person-circle-outline', 'person-circle') }} />
    </Tabs>
  );
}
