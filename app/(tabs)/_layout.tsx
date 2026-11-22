import React from 'react';
import { Tabs } from 'expo-router';
import { CinemaTabBar } from '../../src/components/navigation/CinemaTabBar';

/** Trang chủ, Khám phá and Hồ sơ. Gói Tháng is a stack screen (app/vip), opened from Hồ sơ or an unlock. */
export default function TabLayout() {
  return (
    <Tabs
      // Gói Tháng's back button returns where it was opened from.
      backBehavior="history"
      tabBar={(props) => <CinemaTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trang chủ' }} />
      <Tabs.Screen name="explore" options={{ title: 'Khám phá' }} />
      <Tabs.Screen name="history" options={{ title: 'Lịch sử xem' }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ' }} />
    </Tabs>
  );
}
