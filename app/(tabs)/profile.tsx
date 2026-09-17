import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import { Header } from '../../src/components/common/Header';
import { ThemeToggle } from '../../src/components/common/ThemeToggle';
import { useTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/useAppStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    isAuthenticated,
    user,
    wallet,
    transactions,
    watchHistory,
    isVIPMode,
    toggleVIPMode,
    logout,
    openAuthModal,
    setCheckInModalOpen,
    setTopUpModalOpen,
    toggleChat,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'history' | 'transactions'>('history');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredTxns = transactions.filter((tx) => {
    if (filterType === 'all') return true;
    return tx.type === filterType;
  });

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.guestContainer}>
          <View style={[styles.guestIconCircle, { backgroundColor: 'rgba(229, 9, 20, 0.12)' }]}>
            <Ionicons name="person" size={40} color={colors.ruby} />
          </View>
          <Text style={[styles.guestTitle, { color: colors.text }]}>Chào Mừng Đến Với AI Cinema</Text>
          <Text style={[styles.guestSub, { color: colors.textSecondary }]}>
            Đăng nhập để đồng bộ lịch sử xem phim, quản lý ví Coin và tham gia vào Studio AI.
          </Text>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.ruby }]}
            onPress={() => openAuthModal('login')}
          >
            <Text style={styles.primaryBtnText}>Đăng Nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => openAuthModal('register')}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
              Đăng Ký Tài Khoản Mới
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.ruby }]}>
              <Text style={styles.avatarInitial}>{user?.name?.charAt(0) || 'U'}</Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
              {(user?.isVIP || isVIPMode) && (
                <View style={styles.vipBadge}>
                  <Text style={styles.vipBadgeText}>VIP PRO</Text>
                </View>
              )}
            </View>
            <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email}</Text>
          </View>
        </View>

        {/* VIP Status Banner */}
        <View
          style={[
            styles.vipCard,
            {
              backgroundColor: isVIPMode ? (isDark ? '#2E1E0F' : '#FFFBEB') : colors.surface,
              borderColor: isVIPMode ? '#F59E0B' : colors.border,
            },
          ]}
        >
          <View style={styles.vipCardHeader}>
            <View style={styles.vipTitleRow}>
              <FontAwesome5 name="crown" size={16} color="#F59E0B" />
              <Text style={[styles.vipCardTitle, { color: isVIPMode ? '#F59E0B' : colors.text }]}>
                {isVIPMode ? 'Thành Viên VIP Hoàng Gia' : 'Gói Hội Viên Tiêu Chuẩn'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleVIPMode}
              style={[
                styles.vipToggleBtn,
                { backgroundColor: isVIPMode ? '#F59E0B20' : colors.ruby },
              ]}
            >
              <Text
                style={[
                  styles.vipToggleBtnText,
                  { color: isVIPMode ? '#F59E0B' : '#FFFFFF' },
                ]}
              >
                {isVIPMode ? 'Đổi Gói' : 'Nâng VIP'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.vipCardDesc, { color: colors.textSecondary }]}>
            {isVIPMode
              ? 'Mở khóa toàn bộ kho phim 4K không quảng cáo, nhận +50 Coin thưởng mỗi tháng.'
              : 'Nâng cấp lên VIP để xem không giới hạn kho phim AI độc quyền và nhận ưu đãi Coin.'}
          </Text>
        </View>

        {/* Wallet Overview Card */}
        <View
          style={[
            styles.walletCard,
            {
              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.walletHeader}>
            <View style={styles.walletTitleRow}>
              <FontAwesome5 name="wallet" size={16} color="#F59E0B" />
              <Text style={[styles.walletTitle, { color: colors.text }]}>Ví AI Cinema</Text>
            </View>
            <Text style={[styles.walletSub, { color: colors.textMuted }]}>Dual Coin Balance</Text>
          </View>

          <View style={styles.coinsRow}>
            {/* Main Coin */}
            <View style={styles.coinCol}>
              <Text style={[styles.coinColLabel, { color: colors.textSecondary }]}>Coin Chính</Text>
              <View style={styles.coinAmountRow}>
                <FontAwesome5 name="coins" size={16} color="#F59E0B" />
                <Text style={[styles.coinAmount, { color: colors.text }]}>{wallet.mainCoin}</Text>
              </View>
            </View>

            <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

            {/* Bonus Coin */}
            <View style={styles.coinCol}>
              <Text style={[styles.coinColLabel, { color: colors.textSecondary }]}>Coin Thưởng</Text>
              <View style={styles.coinAmountRow}>
                <Ionicons name="gift" size={18} color="#8B5CF6" />
                <Text style={[styles.coinAmount, { color: colors.text }]}>{wallet.bonusCoin}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.walletActions}>
            <TouchableOpacity
              style={[styles.walletActionBtn, { backgroundColor: '#F59E0B' }]}
              onPress={() => setTopUpModalOpen(true)}
            >
              <Ionicons name="add-circle" size={16} color="#FFFFFF" />
              <Text style={styles.walletActionText}>Nạp Coin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.walletActionBtn, { backgroundColor: colors.ruby }]}
              onPress={() => setCheckInModalOpen(true)}
            >
              <Ionicons name="flame" size={16} color="#FFFFFF" />
              <Text style={styles.walletActionText}>Điểm Danh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation Tabs (History vs Transactions) */}
        <View style={styles.tabBarContainer}>
          <TouchableOpacity
            style={[
              styles.mainTabBtn,
              activeTab === 'history' && {
                borderBottomColor: colors.ruby,
                borderBottomWidth: 3,
              },
            ]}
            onPress={() => setActiveTab('history')}
          >
            <View style={styles.tabTitleWithIcon}>
              <Ionicons
                name="time-outline"
                size={18}
                color={activeTab === 'history' ? colors.ruby : colors.textMuted}
              />
              <Text
                style={[
                  styles.mainTabLabel,
                  {
                    color: activeTab === 'history' ? colors.text : colors.textMuted,
                    fontWeight: activeTab === 'history' ? '800' : '600',
                  },
                ]}
              >
                Lịch Sử Xem ({watchHistory.length})
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.mainTabBtn,
              activeTab === 'transactions' && {
                borderBottomColor: colors.ruby,
                borderBottomWidth: 3,
              },
            ]}
            onPress={() => setActiveTab('transactions')}
          >
            <View style={styles.tabTitleWithIcon}>
              <Ionicons
                name="receipt-outline"
                size={18}
                color={activeTab === 'transactions' ? colors.ruby : colors.textMuted}
              />
              <Text
                style={[
                  styles.mainTabLabel,
                  {
                    color: activeTab === 'transactions' ? colors.text : colors.textMuted,
                    fontWeight: activeTab === 'transactions' ? '800' : '600',
                  },
                ]}
              >
                Giao Dịch ({filteredTxns.length})
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Watch History */}
        {activeTab === 'history' && (
          <View style={styles.sectionContainer}>
            {watchHistory.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <Ionicons name="film-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Bạn chưa xem bộ phim nào gần đây
                </Text>
                <TouchableOpacity
                  style={[styles.exploreBtn, { backgroundColor: colors.ruby }]}
                  onPress={() => router.push('/')}
                >
                  <Text style={styles.exploreBtnText}>Khám Phá Phim Ngay</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.historyList}>
                {watchHistory.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/watch/${item.movieId}` as any)}
                    style={[
                      styles.historyCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {/* Thumbnail */}
                    <View style={styles.historyThumbBox}>
                      <Image source={{ uri: item.thumbnailUrl }} style={styles.historyThumb} />
                      <View style={styles.thumbPlayIconCircle}>
                        <Ionicons name="play" size={14} color="#FFFFFF" />
                      </View>
                    </View>

                    {/* Meta info */}
                    <View style={styles.historyInfo}>
                      <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.movieTitle}
                      </Text>
                      {item.episodeTitle && (
                        <Text style={[styles.historyEpisode, { color: colors.ruby }]} numberOfLines={1}>
                          Tập {item.episodeNumber}: {item.episodeTitle}
                        </Text>
                      )}

                      {/* Progress bar */}
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressTrack, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                          <View style={[styles.progressBar, { width: `${item.progressPercent}%`, backgroundColor: colors.ruby }]} />
                        </View>
                        <Text style={[styles.progressPercent, { color: colors.textMuted }]}>
                          {item.progressPercent}%
                        </Text>
                      </View>

                      <View style={styles.historyTimeRow}>
                        <Text style={[styles.historyDuration, { color: colors.textMuted }]}>
                          Thời lượng: {item.duration}
                        </Text>
                        <Text style={[styles.historyAgo, { color: colors.textMuted }]}>
                          {item.lastWatchedAt}
                        </Text>
                      </View>
                    </View>

                    {/* Action button */}
                    <TouchableOpacity
                      style={[styles.resumeBtn, { backgroundColor: colors.ruby }]}
                      onPress={() => router.push(`/watch/${item.movieId}` as any)}
                    >
                      <Ionicons name="play" size={14} color="#FFFFFF" />
                      <Text style={styles.resumeBtnText}>Xem</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab 2: Transaction History */}
        {activeTab === 'transactions' && (
          <View style={styles.sectionContainer}>
            {/* Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'deposit', label: 'Nạp tiền' },
                { id: 'episode_purchase', label: 'Mua tập' },
                { id: 'checkin', label: 'Điểm danh' },
              ].map((tab) => {
                const isSelected = filterType === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    activeOpacity={0.8}
                    onPress={() => setFilterType(tab.id)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected
                          ? colors.ruby
                          : isDark
                          ? '#1E293B'
                          : '#F1F5F9',
                        borderColor: isSelected ? colors.ruby : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* List of transactions */}
            <View style={styles.txnList}>
              {filteredTxns.map((tx) => {
                const isPositive = tx.totalAmount > 0;
                return (
                  <View
                    key={tx.id}
                    style={[
                      styles.txnCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.txnLeft}>
                      <View
                        style={[
                          styles.txnIcon,
                          {
                            backgroundColor: isPositive
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(239, 68, 68, 0.12)',
                          },
                        ]}
                      >
                        <Ionicons
                          name={isPositive ? 'arrow-down' : 'arrow-up'}
                          size={16}
                          color={isPositive ? '#10B981' : '#EF4444'}
                        />
                      </View>
                      <View style={styles.txnInfo}>
                        <Text style={[styles.txnTitle, { color: colors.text }]} numberOfLines={1}>
                          {tx.typeLabel}
                        </Text>
                        <Text style={[styles.txnDesc, { color: colors.textMuted }]} numberOfLines={1}>
                          {tx.description}
                        </Text>
                        <Text style={[styles.txnDate, { color: colors.textMuted }]}>
                          {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.txnRight}>
                      <Text
                        style={[
                          styles.txnAmount,
                          { color: isPositive ? '#10B981' : '#EF4444' },
                        ]}
                      >
                        {isPositive ? `+${tx.totalAmount}` : tx.totalAmount} Coin
                      </Text>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>{tx.statusLabel}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick Settings */}
        <View
          style={[
            styles.settingsCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="color-palette-outline" size={18} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Giao diện Sáng / Tối</Text>
            </View>
            <ThemeToggle />
          </View>

          <TouchableOpacity style={styles.settingRow} onPress={toggleChat}>
            <View style={styles.settingLeft}>
              <Ionicons name="chatbubbles-outline" size={18} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Hỗ trợ trực tuyến 24/7</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Đăng xuất tài khoản</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  guestIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  guestSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
  },
  vipBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  vipBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  email: {
    fontSize: 12,
  },
  vipCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  vipCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vipCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  vipToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  vipToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  vipCardDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  walletCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  walletSub: {
    fontSize: 11,
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  coinCol: {
    alignItems: 'center',
    gap: 4,
  },
  coinColLabel: {
    fontSize: 11,
  },
  coinAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  verticalDivider: {
    width: 1,
    height: 30,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 10,
  },
  walletActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  walletActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBarContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    marginTop: 4,
  },
  mainTabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainTabLabel: {
    fontSize: 13,
  },
  sectionContainer: {
    gap: 10,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  exploreBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  historyThumbBox: {
    width: 90,
    height: 58,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  historyThumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlayIconCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
    gap: 3,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  historyEpisode: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressPercent: {
    fontSize: 10,
    fontWeight: '700',
    width: 28,
  },
  historyTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDuration: {
    fontSize: 10,
  },
  historyAgo: {
    fontSize: 10,
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  resumeBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  filterRow: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  txnList: {
    gap: 8,
  },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  txnIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnInfo: {
    flex: 1,
    gap: 2,
  },
  txnTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  txnDesc: {
    fontSize: 11,
  },
  txnDate: {
    fontSize: 10,
  },
  txnRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  txnAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '700',
  },
  settingsCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});

