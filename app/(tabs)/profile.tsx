import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuCard, MenuRow } from '../../src/components/common/MenuRow';
import { useTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/useAppStore';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const {
    isAuthenticated,
    user,
    wallet,
    movies,
    watchHistory,
    subscription,
    isVIPMode,
    openAuthModal,
    setCheckInModalOpen,
    toggleChat,
  } = useAppStore();

  /** Runs `action` for a Member, otherwise asks the Guest to sign in first. */
  const member = (action: () => void) => () => (isAuthenticated ? action() : openAuthModal('login'));
  const running = isVIPMode && subscription;
  const posterOf = (movieId: string, fallback: string) =>
    movies.find((m) => m.id === movieId)?.posterUrl || fallback;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: Math.max(insets.top, 10) + 24 }]}
      >
        {/* Avatar + name */}
        <TouchableOpacity
          activeOpacity={isAuthenticated ? 1 : 0.8}
          onPress={isAuthenticated ? undefined : () => openAuthModal('login')}
          style={styles.identity}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.cardAlt }]}>
              {isAuthenticated ? (
                <Text style={[styles.initial, { color: colors.text }]}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
              ) : (
                <Ionicons name="person" size={34} color={colors.textMuted} />
              )}
            </View>
          )}
          <View style={styles.identityText}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {isAuthenticated ? user?.name || 'Thành viên' : 'Đăng nhập / Đăng ký >'}
            </Text>
            <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>
              {isAuthenticated ? user?.email : 'Lưu ví Coin, gói Tháng và lịch sử xem'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Monthly plan card (gold, like MultiShorts' VIP card) */}
        <LinearGradient colors={colors.vipGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.vip}>
          <View style={styles.vipHead}>
            <View style={styles.vipTitles}>
              <Text style={[styles.vipTitle, { color: colors.vipText }]}>
                {running ? subscription.plan.name : 'Đăng ký Gói Tháng'}
              </Text>
              <Text style={styles.vipSub}>
                {running
                  ? `Hiệu lực đến ${new Date(subscription.currentPeriodEnd).toLocaleDateString('vi-VN')}`
                  : 'Quyền lợi thành viên'}
              </Text>
            </View>
            <TouchableOpacity style={styles.vipBtn} onPress={member(() => router.push('/(tabs)/vip'))}>
              <Text style={styles.vipBtnText}>{running ? 'Quản lý' : 'Đăng ký'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.perks}>
            <View style={styles.perk}>
              <Ionicons name="lock-open-outline" size={18} color={colors.vipText} />
              <Text style={[styles.perkText, { color: colors.vipText }]}>Mở mọi tập đã phát hành</Text>
            </View>
            <View style={styles.perk}>
              <Ionicons name="refresh-outline" size={18} color={colors.vipText} />
              <Text style={[styles.perkText, { color: colors.vipText }]}>Gia hạn bằng Coin</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Watch history */}
        <View style={[styles.block, { backgroundColor: colors.card }]}>
          <Text style={[styles.blockTitle, { color: colors.text }]}>Lịch sử</Text>
          {watchHistory.length === 0 ? (
            <Text style={[styles.blockEmpty, { color: colors.textMuted }]}>Bạn chưa xem phim nào.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyRow}>
              {watchHistory.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyItem}
                  onPress={() =>
                    router.push({ pathname: '/watch/[id]', params: { id: item.movieId, episodeId: item.episodeId } })
                  }
                >
                  <Image
                    source={{ uri: posterOf(item.movieId, item.thumbnailUrl) }}
                    style={[styles.historyPoster, { backgroundColor: colors.cardAlt }]}
                  />
                  <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.movieTitle}
                  </Text>
                  <Text style={[styles.historyEp, { color: colors.textMuted }]}>EP.{item.episodeNumber}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Menu */}
        <MenuCard>
          <MenuRow
            icon="wallet-outline"
            label="Ví"
            value={isAuthenticated ? `${wallet.mainCoin + wallet.bonusCoin} Coin` : undefined}
            onPress={member(() => router.push('/wallet'))}
          />
          <MenuRow icon="gift-outline" label="Trung tâm phần thưởng" onPress={member(() => setCheckInModalOpen(true))} />
          <MenuRow icon="notifications-outline" label="Thông báo" onPress={member(() => router.push('/notifications'))} />
          <MenuRow icon="paper-plane-outline" label="Chăm sóc khách hàng" onPress={toggleChat} />
          <MenuRow icon="settings-outline" label="Cài đặt" onPress={() => router.push('/settings')} last />
        </MenuCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Room for the floating tab bar.
  scroll: { paddingBottom: 120, gap: 16 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, marginBottom: 6 },
  avatar: { width: 68, height: 68, borderRadius: 34 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 26, fontWeight: '800' },
  identityText: { flex: 1, gap: 6 },
  name: { fontSize: 20, fontWeight: '800' },
  sub: { fontSize: 13 },
  vip: { marginHorizontal: 16, borderRadius: 18, padding: 18, gap: 18 },
  vipHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vipTitles: { flex: 1, gap: 4 },
  vipTitle: { fontSize: 20, fontWeight: '800' },
  vipSub: { fontSize: 13, color: 'rgba(74, 42, 5, 0.7)' },
  vipBtn: { backgroundColor: '#3A2106', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9 },
  vipBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  perks: { flexDirection: 'row', gap: 18, flexWrap: 'wrap' },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  perkText: { fontSize: 13.5, fontWeight: '600' },
  block: { marginHorizontal: 16, borderRadius: 16, paddingVertical: 16, gap: 12 },
  blockTitle: { fontSize: 17, fontWeight: '700', paddingHorizontal: 16 },
  blockEmpty: { fontSize: 13, paddingHorizontal: 16 },
  historyRow: { paddingHorizontal: 16, gap: 10 },
  historyItem: { width: 84 },
  historyPoster: { width: 84, height: 116, borderRadius: 8 },
  historyTitle: { fontSize: 12.5, marginTop: 6 },
  historyEp: { fontSize: 11.5, marginTop: 2 },
});
