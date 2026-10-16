import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { HOME_TABS, type HomeTabKey } from '../../lib/homeFeed';
import { styles } from '../../styles/components/home/HomeTabBar.styles';

interface HomeTabBarProps {
  active: HomeTabKey;
  onChange: (tab: HomeTabKey) => void;
}

/** The home sections as words: the open one large and pink, the rest small and grey. */
export const HomeTabBar: React.FC<HomeTabBarProps> = ({ active, onChange }) => {
  const { colors } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll}>
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
            <Text style={selected ? [styles.active, { color: colors.ruby }] : [styles.idle, { color: colors.textMuted }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};
