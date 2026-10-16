import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { textStyle, useTheme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

interface HomeTopBarProps {
  /** A film title shown as the search hint. */
  hint?: string;
}

/** Search pill and the reward gift (check-in / spins) at the top of the home screen. */
export const HomeTopBar: React.FC<HomeTopBarProps> = ({ hint }) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isAuthenticated, dailyReward, openAuthModal, setCheckInModalOpen } = useAppStore();

  // Something to collect today: check-in not done yet, or spins left (both from the BE).
  const spins = dailyReward?.availableSpins ?? 0;
  const checkInWaiting = Boolean(dailyReward && !dailyReward.checkedInToday);

  const openRewards = () => (isAuthenticated ? setCheckInModalOpen(true) : openAuthModal('login'));

  return (
    <View style={styles.row}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/search')}
        style={[styles.search, { backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(29,18,22,0.06)' }]}
        accessibilityRole="search"
        accessibilityLabel="Tìm phim"
      >
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <Text style={[styles.hint, { color: colors.textMuted }]} numberOfLines={1}>
          {hint || 'Tìm tên phim'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={openRewards}
        style={styles.gift}
        accessibilityLabel={spins > 0 ? `Quà hằng ngày, còn ${spins} lượt quay` : 'Quà hằng ngày'}
      >
        <Ionicons name="gift" size={30} color={colors.coin} />
        {spins > 0 ? (
          <View style={[styles.count, { backgroundColor: colors.ruby, borderColor: colors.background }]}>
            <Text style={styles.countText}>{spins}</Text>
          </View>
        ) : checkInWaiting ? (
          <View style={[styles.dot, { backgroundColor: colors.ruby, borderColor: colors.background }]} />
        ) : null}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 6 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
  },
  hint: { ...textStyle.body, flex: 1 },
  gift: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  count: {
    position: 'absolute',
    top: -1,
    right: -3,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { ...textStyle.captionStrong, fontSize: 11, lineHeight: 14, color: '#FFFFFF' },
  dot: { position: 'absolute', top: 4, right: 2, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
});
