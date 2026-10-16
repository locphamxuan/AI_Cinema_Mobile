import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { textStyle, useTheme } from '../../theme';

interface ScreenHeaderProps {
  title: string;
  right?: React.ReactNode;
}

/** Sub-screen header: round back button on the left, the title in the middle. */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, right }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.bar, { paddingTop: Math.max(insets.top, 10) }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.back, { backgroundColor: colors.cardAlt }]}
        accessibilityLabel="Quay lại"
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.side}>{right}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyle.title, flex: 1, textAlign: 'center' },
  side: { width: 40, alignItems: 'flex-end' },
});
