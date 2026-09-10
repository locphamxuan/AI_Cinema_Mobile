import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';

interface WalletHeaderBadgeProps {
  onPress?: () => void;
}

export const WalletHeaderBadge: React.FC<WalletHeaderBadgeProps> = ({ onPress }) => {
  const { wallet, setCheckInModalOpen, setTopUpModalOpen, isAuthenticated } = useAppStore();
  const { colors, isDark } = useTheme();

  if (!isAuthenticated) return null;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setCheckInModalOpen(true);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
          borderColor: isDark ? '#334155' : '#E2E8F0',
        },
      ]}
    >
      {/* Main Coin */}
      <View style={styles.coinPill}>
        <FontAwesome5 name="coins" size={11} color="#F59E0B" />
        <Text style={[styles.coinText, { color: colors.text }]}>{wallet.mainCoin}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: isDark ? '#475569' : '#CBD5E1' }]} />

      {/* Bonus Coin */}
      <View style={styles.coinPill}>
        <Ionicons name="gift" size={12} color="#8B5CF6" />
        <Text style={[styles.coinText, { color: colors.text }]}>{wallet.bonusCoin}</Text>
      </View>

      {/* Add button */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setTopUpModalOpen(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="add-circle" size={16} color="#E50914" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 12,
  },
  addBtn: {
    marginLeft: 2,
  },
});
