import React from 'react';
import { Platform, Text, View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts, useTheme } from '../../src/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Outline icon at rest, filled icon inside a soft rounded pill when the tab is active. */
function tabIcon(name: IconName, active: IconName, activeBg: string) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return (
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: focused ? activeBg : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={focused ? active : name} size={22} color={color as string} />
      </View>
    );
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
        tabBarActiveBackgroundColor: 'transparent',
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.border,
          borderWidth: 1,
          borderTopWidth: 1,
          borderRadius: 34,
          overflow: 'hidden',
          height: 68,
          paddingHorizontal: 8,
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
          overflow: 'hidden',
          marginHorizontal: 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabel: ({ focused, color, children }) => (
          <Text
            style={{
              fontFamily: focused ? fonts.bold : fonts.medium,
              fontSize: 12,
              lineHeight: 15,
              color,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {children}
          </Text>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Trang chủ', tabBarIcon: tabIcon('play-circle-outline', 'play-circle', colors.rubySoft) }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: 'Khám phá', tabBarIcon: tabIcon('compass-outline', 'compass', colors.rubySoft) }}
      />
      <Tabs.Screen
        name="schedule"
        options={{ title: 'Lịch chiếu', tabBarIcon: tabIcon('calendar-clear-outline', 'calendar-clear', colors.rubySoft) }}
      />
      <Tabs.Screen name="vip" options={{ title: 'Gói Tháng', tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Hồ sơ', tabBarIcon: tabIcon('person-circle-outline', 'person-circle', colors.rubySoft) }}
      />
    </Tabs>
  );
}
