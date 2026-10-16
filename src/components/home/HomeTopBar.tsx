import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

interface HomeTopBarProps {
  /** A film title shown as the search hint, like MultiShorts does. */
  hint?: string;
}

/** Search pill and the reward gift (check-in / spins) at the top of the home screen. */
export const HomeTopBar: React.FC<HomeTopBarProps> = ({ hint }) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isAuthenticated, dailyReward, openAuthModal, setCheckInModalOpen } = useAppStore();

  // Something to collect today: check-in not done yet, or spins left (both from the BE).
  const rewardWaiting = Boolean(dailyReward && (!dailyReward.checkedInToday || dailyReward.availableSpins > 0));

  const openRewards = () => (isAuthenticated ? setCheckInModalOpen(true) : openAuthModal('login'));

  return (
    <View style={styles.row}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/search')}
        style={[styles.search, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}
        accessibilityRole="search"
        accessibilityLabel="Tìm kiếm phim"
      >
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <Text style={[styles.hint, { color: colors.textMuted }]} numberOfLines={1}>
          {hint || 'Tìm phim, thể loại...'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={openRewards} style={styles.gift} accessibilityLabel="Phần thưởng">
        <Ionicons name="gift" size={30} color={colors.coin} />
        {rewardWaiting && (
          <View style={[styles.dot, { backgroundColor: colors.ruby }]}>
            <Text style={styles.dotText}>
              {dailyReward && dailyReward.availableSpins > 0 ? dailyReward.availableSpins : '!'}
            </Text>
          </View>
        )}
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
  hint: { flex: 1, fontSize: 15 },
  gift: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    top: 0,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
});
