import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={toggleTheme}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
          borderColor: isDark ? '#334155' : '#CBD5E1',
        },
      ]}
      accessibilityRole="switch"
      accessibilityLabel={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
    >
      <View style={styles.iconWrapper}>
        <Ionicons
          name="sunny"
          size={14}
          color={isDark ? '#64748B' : '#F59E0B'}
        />
      </View>
      <View style={styles.iconWrapper}>
        <Ionicons
          name="moon"
          size={13}
          color={isDark ? '#818CF8' : '#94A3B8'}
        />
      </View>
      <View
        style={[
          styles.knob,
          {
            backgroundColor: isDark ? '#6366F1' : '#FFFFFF',
            transform: [{ translateX: isDark ? 30 : 2 }],
          },
        ]}
      >
        <Ionicons
          name={isDark ? 'moon' : 'sunny'}
          size={13}
          color={isDark ? '#FFFFFF' : '#F59E0B'}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 62,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    position: 'relative',
  },
  iconWrapper: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    left: 1,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
});
