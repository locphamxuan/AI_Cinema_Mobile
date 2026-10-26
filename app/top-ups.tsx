import React from 'react';
import { ActivityIndicator, FlatList, Linking, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../src/components/common/ScreenHeader';
import { walletService } from '../src/services/walletService';
import { canResumePayment, formatVnd, orderTime, TOP_UP_STATUS, type StatusTone } from '../src/lib/topUps';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme';
import type { CoinTopUp } from '../src/types/episodeAccess';
import { styles } from '../src/styles/screens/topUps.styles';

const PROVIDER_NAME: Record<string, string> = { VNPAY: 'VNPay', MOMO: 'MoMo' };

/** "Lịch sử nạp Coin": every top-up order of the member, newest first, with its payment state. */
export default function TopUpHistoryScreen() {
  const { colors } = useTheme();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [orders, setOrders] = React.useState<CoinTopUp[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (next: number) => {
    setLoading(true);
    const res = await walletService.getTopUps(next);
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.message || 'Không tải được lịch sử nạp Coin.');
      return;
    }
    setError(null);
    const rows = res.data.data ?? [];
    setOrders((prev) => (next === 1 ? rows : [...prev, ...rows]));
    setTotalPages(res.data.meta?.totalPages ?? 1);
    setPage(next);
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) void load(1);
  }, [isAuthenticated, load]);

  const refresh = async () => {
    setRefreshing(true);
    await load(1);
    setRefreshing(false);
  };

  const toneColor: Record<StatusTone, string> = { success: colors.verified, pending: colors.coin, failed: colors.danger };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Lịch sử nạp Coin" />
      {!isAuthenticated ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>Đăng nhập để xem các lần nạp Coin.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.topUpId}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ruby} />}
          onEndReached={() => !loading && page < totalPages && void load(page + 1)}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          ListEmptyComponent={
            loading ? null : <Text style={[styles.empty, { color: colors.textMuted }]}>Bạn chưa nạp Coin lần nào.</Text>
          }
          ListFooterComponent={loading ? <ActivityIndicator color={colors.ruby} style={styles.loading} /> : null}
          renderItem={({ item }) => {
            const status = TOP_UP_STATUS[item.status];
            const tint = toneColor[status.tone];
            return (
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.top}>
                  <View style={[styles.icon, { backgroundColor: colors.cardAlt }]}>
                    <Ionicons name="wallet-outline" size={18} color={colors.coin} />
                  </View>
                  <View style={styles.info}>
                    <Text style={[styles.coins, { color: colors.text }]}>+{item.coinsGranted} Coin chính</Text>
                    <Text style={[styles.meta, { color: colors.textMuted }]}>
                      {formatVnd(item.amountVnd)}
                      {item.provider ? ` · ${PROVIDER_NAME[item.provider] ?? item.provider}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.status, { color: tint, borderColor: tint }]}>{status.label}</Text>
                </View>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {item.paidAt ? `Thanh toán lúc ${orderTime(item.paidAt)}` : `Tạo lúc ${orderTime(item.createdAt)}`}
                </Text>
                {item.failureReason && status.tone === 'failed' ? (
                  <Text style={[styles.meta, { color: colors.textMuted }]}>Lý do: {item.failureReason}</Text>
                ) : null}
                {canResumePayment(item) ? (
                  <TouchableOpacity
                    style={[styles.resume, { backgroundColor: colors.rubySoft }]}
                    onPress={() => void Linking.openURL(item.redirectUrl!)}
                    accessibilityRole="link"
                  >
                    <Text style={[styles.resumeText, { color: colors.ruby }]}>Tiếp tục thanh toán</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
