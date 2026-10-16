import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { HOME_TABS, type HomeTabKey } from '../../lib/homeFeed';

interface HomeTabBarProps {
  active: HomeTabKey;
  onChange: (tab: HomeTabKey) => void;
}

export const HomeTabBar: React.FC<HomeTabBarProps> = ({ active, onChange }) => {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {HOME_TABS.map((tab) => {
        const selected = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text
              style={[
                styles.label,
                selected
                  ? { color: colors.ruby, fontSize: 20, fontWeight: '900' }
                  : { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 22,
    alignItems: 'baseline',
  },
  label: {
    letterSpacing: -0.2,
  },
});
