import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { styles } from '../../styles/components/home/HomeTopBar.styles';

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
