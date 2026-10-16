import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuCard, MenuRow } from '../../src/components/common/MenuRow';
import { fonts, textStyle, useTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/useAppStore';
import { useUnreadNotifications } from '../../src/hooks/useUnreadNotifications';

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
  const unread = useUnreadNotifications(isAuthenticated);

  /** Runs `action` for a Member, otherwise asks the Guest to sign in first. */
  const member = (action: () => void) => () => (isAuthenticated ? action() : openAuthModal('login'));
  const running = isVIPMode && subscription;
  const posterOf = (movieId: string, fallback: string) => movies.find((m) => m.id === movieId)?.posterUrl || fallback;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingTop: Math.max(insets.top, 10) + 20 }]}>
        <TouchableOpacity
          activeOpacity={isAuthenticated ? 1 : 0.8}
          onPress={isAuthenticated ? undefined : () => openAuthModal('login')}
          style={styles.identity}
          accessibilityRole={isAuthenticated ? undefined : 'button'}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.cardAlt }]}>
              {isAuthenticated ? (
                <Text style={[styles.initial, { color: colors.text }]}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
              ) : (
                <Ionicons name="person" size={30} color={colors.textMuted} />
              )}
            </View>
          )}
          <View style={styles.identityText}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {isAuthenticated ? user?.name || 'Thành viên' : 'Đăng nhập'}
              </Text>
              {!isAuthenticated && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
            </View>
            <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>
              {isAuthenticated ? user?.email : 'Để dùng ví Coin và gói Tháng'}
            </Text>
          </View>
        </TouchableOpacity>

        <LinearGradient colors={colors.vipGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pass}>
          <View style={styles.passText}>
            <Text style={[styles.passTitle, { color: colors.vipText }]}>{running ? subscription.plan.name : 'Gói Tháng'}</Text>
            <Text style={[styles.passLine, { color: colors.vipText }]}>
              {running
                ? `Dùng được đến ${new Date(subscription.currentPeriodEnd).toLocaleDateString('vi-VN')}`
                : 'Xem mọi tập đã phát hành trong kỳ, trả bằng Coin.'}
            </Text>
          </View>
          <TouchableOpacity style={styles.passBtn} onPress={member(() => router.push('/(tabs)/vip'))}>
            <Text style={styles.passBtnText}>{running ? 'Xem gói' : 'Xem giá'}</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.block}>
          <Text style={[styles.blockTitle, { color: colors.text }]}>Đang xem dở</Text>
          {watchHistory.length === 0 ? (
            <Text style={[styles.blockEmpty, { color: colors.textMuted }]}>Phim bạn mở sẽ hiện ở đây để xem tiếp.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyRow}>
              {watchHistory.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyItem}
                  onPress={() => router.push({ pathname: '/watch/[id]', params: { id: item.movieId, episodeId: item.episodeId } })}
                  accessibilityLabel={`${item.movieTitle}, tập ${item.episodeNumber}`}
                >
                  <Image source={{ uri: posterOf(item.movieId, item.thumbnailUrl) }} style={[styles.historyPoster, { backgroundColor: colors.cardAlt }]} />
                  <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.movieTitle}
                  </Text>
                  <Text style={[styles.historyEp, { color: colors.textMuted }]}>Tập {item.episodeNumber}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <MenuCard>
          <MenuRow
            icon="wallet-outline"
            label="Ví Coin"
            value={isAuthenticated ? `${wallet.mainCoin} chính, ${wallet.bonusCoin} thưởng` : undefined}
            onPress={member(() => router.push('/wallet'))}
          />
          <MenuRow icon="gift-outline" label="Quà hằng ngày" onPress={member(() => setCheckInModalOpen(true))} />
          <MenuRow icon="notifications-outline" label="Thông báo" count={unread} onPress={member(() => router.push('/notifications'))} />
          <MenuRow icon="chatbubble-ellipses-outline" label="Hỗ trợ" onPress={toggleChat} />
          <MenuRow icon="settings-outline" label="Cài đặt" onPress={() => router.push('/settings')} last />
        </MenuCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Room for the floating tab bar.
  scroll: { paddingBottom: 120, gap: 20 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: fonts.displayHeavy, fontSize: 28, lineHeight: 32 },
  identityText: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { ...textStyle.title, fontSize: 20, lineHeight: 26, flexShrink: 1 },
  sub: { ...textStyle.label },
  pass: { marginHorizontal: 16, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  passText: { flex: 1, gap: 4 },
  passTitle: { fontFamily: fonts.displayHeavy, fontSize: 26, lineHeight: 30 },
  passLine: { ...textStyle.label, opacity: 0.85 },
  passBtn: { backgroundColor: '#3D2306', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9 },
  passBtnText: { ...textStyle.labelStrong, color: '#FFFFFF' },
  block: { gap: 12 },
  blockTitle: { ...textStyle.title, paddingHorizontal: 16 },
  blockEmpty: { ...textStyle.label, paddingHorizontal: 16 },
  historyRow: { paddingHorizontal: 16, gap: 10 },
  historyItem: { width: 92 },
  historyPoster: { width: 92, height: 126, borderRadius: 6 },
  historyTitle: { ...textStyle.label, marginTop: 6 },
  historyEp: { ...textStyle.caption },
});
