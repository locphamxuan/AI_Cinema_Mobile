import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { styles } from '../../styles/components/navigation/CinemaTabBar.styles';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = keyof typeof Ionicons.glyphMap;

/** The tabs of the bar, outline icon at rest and filled when active; a route not listed here gets no button. */
export const TAB_ITEMS: Record<string, { label: string; icon: IconName; activeIcon: IconName }> = {
  index: { label: 'Trang chủ', icon: 'home-outline', activeIcon: 'home' },
  explore: { label: 'Khám phá', icon: 'compass-outline', activeIcon: 'compass' },
  profile: { label: 'Hồ sơ', icon: 'person-circle-outline', activeIcon: 'person-circle' },
};

/**
 * The floating tab bar: a rounded capsule above the gesture bar. The active tab grows into a ruby pill with its
 * label, the others show their icon only, so Vietnamese labels with stacked marks are never clipped.
 */
export function CinemaTabBar({ state, emitter, navigateToTab }: TabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((route) => TAB_ITEMS[route.name]);

  return (
    <View
      style={[
        styles.bar,
        {
          bottom: insets.bottom + 8,
          backgroundColor: colors.tabBarBg,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
          shadowOpacity: isDark ? 0.4 : 0.14,
        },
      ]}
      accessibilityRole="tablist"
    >
      {routes.map((route) => {
        const item = TAB_ITEMS[route.name];
        const focused = state.routes[state.index]?.key === route.key;
        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={item.label}
            style={({ pressed }) => [
              styles.tab,
              focused && { backgroundColor: colors.ruby, flexGrow: 1.6 },
              pressed && !focused && { backgroundColor: colors.rubySoft },
            ]}
          >
            <Ionicons
              name={focused ? item.activeIcon : item.icon}
              size={22}
              color={focused ? '#FFFFFF' : colors.tabBarInactive}
            />
            {focused && (
              <Text style={styles.label} numberOfLines={1}>
                {item.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
