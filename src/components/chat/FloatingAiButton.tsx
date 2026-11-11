import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme, fonts } from '../../theme';
import { useUiStore } from '../../store';
import { AiOrb } from './AiOrb';

/**
 * Floating Smart Assistant launcher for Web users (`role: user` on Expo Web),
 * ensuring Chatbox AI is visible on every page without crowding mobile screens.
 */
export const FloatingAiButton: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { isChatModalOpen, isAuthModalOpen, setChatModalOpen } = useUiStore();

  if (Platform.OS !== 'web' || isChatModalOpen || isAuthModalOpen) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setChatModalOpen(true)}
      accessibilityRole="button"
      accessibilityLabel="Mở Trợ lý AI"
      style={[
        styles.fab,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: 'rgba(236, 72, 153, 0.45)',
        },
      ]}
    >
      <AiOrb size="sm" />
      <Text style={[styles.label, { color: colors.text }]}>Trợ lý AI</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
    paddingRight: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#EC4899',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
});
