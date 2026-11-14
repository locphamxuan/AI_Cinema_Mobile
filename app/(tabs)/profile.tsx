
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuCard, MenuRow } from '../../src/components/common/MenuRow';
import { useTheme } from '../../src/theme';
import { useSessionStore, useAccountStore, useCatalogStore, useUiStore } from '../../src/store';
import { useUnreadNotifications } from '../../src/hooks/useUnreadNotifications';
import { useWatchHistory } from '../../src/hooks/useWatchHistory';
import { latestPerMovie } from '../../src/lib/watchHistory';
import { styles } from '../../src/styles/screens/tabs/profile.styles';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isAuthenticated, user } = useSessionStore();
  const { wallet, subscription, isVIPMode } = useAccountStore();
  const { movies } = useCatalogStore();
  const { openAuthModal, setCheckInModalOpen, setChatModalOpen } = useUiStore();
  const unread = useUnreadNotifications(isAuthenticated);
  const watching = latestPerMovie(useWatchHistory(isAuthenticated));

  /** Runs `action` for a Member, otherwise asks the Guest to sign in first. */
  const member = (action: () => void) => () => (isAuthenticated ? action() : openAuthModal('login'));
  const running = isVIPMode && subscription;
  const posterOf = (movieId: string, fallback: string | null) => movies.find((m) => m.id === movieId)?.posterUrl || fallback || undefined;

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

        {isAuthenticated && (
          <View style={styles.block}>
            <Text style={[styles.blockTitle, { color: colors.text }]}>Đang xem dở</Text>
            {watching.length === 0 ? (
              <Text style={[styles.blockEmpty, { color: colors.textMuted }]}>Phim bạn mở sẽ hiện ở đây để xem tiếp.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyRow}>
                {watching.map((item) => (
                  <TouchableOpacity
                    key={item.episodeId}
                    style={styles.historyItem}
                    disabled={!item.available}
                    onPress={() => router.push({ pathname: '/watch/[id]', params: { id: item.movieId, episodeId: item.episodeId } })}
                    accessibilityLabel={`${item.movieTitle}, tập ${item.episodeNumber}`}
                  >
                    <Image source={{ uri: posterOf(item.movieId, item.thumbnailUrl) }} style={[styles.historyPoster, { backgroundColor: colors.cardAlt }]} />
                    <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.movieTitle}
                    </Text>
                    <Text style={[styles.historyEp, { color: colors.textMuted }]} numberOfLines={2}>
                      {item.available ? `Tập ${item.episodeNumber}` : item.notice || 'Tập này tạm không xem được'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        <MenuCard>
          <MenuRow
            icon="wallet-outline"
            label="Ví Coin"
            value={isAuthenticated ? `${wallet.mainCoin} chính, ${wallet.bonusCoin} thưởng` : undefined}
            onPress={member(() => router.push('/wallet'))}
          />
          <MenuRow icon="bookmark-outline" label="Phim đã lưu" onPress={member(() => router.push('/saved'))} />
          <MenuRow icon="phone-portrait-outline" label="Thiết bị của tôi" onPress={member(() => router.push('/devices'))} />
          <MenuRow icon="people-outline" label="Bạn bè" onPress={member(() => router.push('/friends' as Href))} />
          <MenuRow icon="tv-outline" label="Tham gia phòng xem nhóm" onPress={member(() => router.push('/watch-party/join' as Href))} />
          <MenuRow icon="gift-outline" label="Quà hằng ngày" onPress={member(() => setCheckInModalOpen(true))} />
          <MenuRow icon="notifications-outline" label="Thông báo" count={unread} onPress={member(() => router.push('/notifications'))} />
          <MenuRow icon="chatbubble-ellipses-outline" label="Trợ lý AI & Hỗ trợ" onPress={() => setChatModalOpen(true)} />
          <MenuRow icon="settings-outline" label="Cài đặt" onPress={() => router.push('/settings')} last />
        </MenuCard>
      </ScrollView>
    </View>
  );
}
