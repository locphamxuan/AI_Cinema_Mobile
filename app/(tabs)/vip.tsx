import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Header } from '../../src/components/common/Header';
import { useTheme } from '../../src/theme';
import { useAppStore, planIsRunning } from '../../src/store/useAppStore';
import { episodeAccessService } from '../../src/services';
import type { MembershipPlan, MySubscription } from '../../src/types/episodeAccess';

const formatDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

/**
 * BR-30: auto-renew can be stopped until `cancelDeadline` (the renewal date minus the window the
 * Admin sets). Which side of that line the member is on is shown before the switch is used.
 */
export function cancelWindowText(plan: MySubscription, now = Date.now()): string {
  if (!plan.autoRenew) return `Đã tắt tự gia hạn — gói dừng khi hết kỳ (${formatDateTime(plan.currentPeriodEnd)}).`;
  if (!plan.cancelDeadline) return 'Gói tự gia hạn khi hết kỳ.';
  return new Date(plan.cancelDeadline).getTime() > now
    ? `Bạn còn tắt được tự gia hạn đến ${formatDateTime(plan.cancelDeadline)}.`
    : 'Đã quá hạn tắt tự gia hạn cho kỳ này — lần gia hạn sắp tới vẫn diễn ra.';
}

export default function VipScreen() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, openAuthModal, setTopUpModalOpen, setWalletBalance, loadAccountData, subscription, wallet } = useAppStore();
  const [plans, setPlans] = useState<MembershipPlan[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    episodeAccessService.getPlans().then((res) => {
      setPlans(res.success && Array.isArray(res.data) ? res.data.filter((p) => !p.isFree && p.isActive && p.priceCoins !== null) : []);
    });
  }, []);

  const reload = useCallback(() => loadAccountData(), [loadAccountData]);
  useEffect(() => {
    if (isAuthenticated) void reload();
  }, [isAuthenticated, reload]);

  const running = planIsRunning(subscription);
  const open = subscription && subscription.status !== 'PENDING' ? subscription : null;

  const join = (plan: MembershipPlan) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    Alert.alert(
      `Đăng ký ${plan.name}`,
      `Trả ${plan.priceCoins} Coin cho ${plan.durationDays} ngày (Coin chính trước, Coin thưởng bù phần thiếu). Gói tự gia hạn mỗi kỳ, bạn tắt được trước ngày gia hạn.`,
      [
        { text: 'Để sau', style: 'cancel' },
        {
          text: 'Đăng ký',
          onPress: async () => {
            setBusy(plan.id);
            const res = await episodeAccessService.joinPlan(plan.id);
            setBusy(null);
            if (!res.success || !res.data) {
              const short = res.statusCode === 422;
              Alert.alert('Chưa đăng ký được', res.message || 'Vui lòng thử lại.', [
                { text: 'Đóng', style: 'cancel' },
                ...(short ? [{ text: 'Nạp Coin', onPress: () => setTopUpModalOpen(true) }] : []),
              ]);
              return;
            }
            setWalletBalance(res.data.mainBalance, res.data.bonusBalance);
            await reload();
            Alert.alert('Đã kích hoạt', `${plan.name} hiệu lực đến ${formatDateTime(res.data.currentPeriodEnd)}.`);
          },
        },
      ],
    );
  };

  const toggleRenew = async (on: boolean) => {
    if (!open) return;
    setBusy('renew');
    const res = await episodeAccessService.setAutoRenew(open.id, on);
    setBusy(null);
    if (!res.success) {
      Alert.alert('Không đổi được', res.message || 'Vui lòng thử lại.');
      return;
    }
    await reload();
  };

  const card = { backgroundColor: isDark ? '#161924' : '#FFFFFF', borderColor: colors.border };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.heading, { color: colors.text }]}>Gói Thành Viên</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Gói Tháng trả bằng Coin, mở mọi tập đã phát hành trong kỳ. Số dư: {wallet.mainCoin} Coin chính · {wallet.bonusCoin} Coin thưởng.
        </Text>

        {open ? (
          <View style={[styles.card, card, { borderColor: running ? '#F59E0B' : '#EF4444' }]}>
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <FontAwesome5 name="crown" size={16} color="#F59E0B" />
                <Text style={[styles.planName, { color: colors.text }]}>{open.plan.name}</Text>
              </View>
              <Text style={[styles.badge, { color: running ? '#10B981' : '#EF4444' }]}>{running ? 'Đang chạy' : 'Gia hạn lỗi'}</Text>
            </View>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>Hết kỳ: {formatDateTime(open.currentPeriodEnd)}</Text>
            {open.status === 'PAST_DUE' && (
              <Text style={styles.warn}>
                Lần gia hạn vừa rồi thiếu Coin. Nạp thêm Coin, hệ thống sẽ tự thử lại; trong lúc chờ bạn chưa xem được trọn bộ.
              </Text>
            )}
            <View style={[styles.rowBetween, { marginTop: 10 }]}>
              <Text style={[styles.meta, { color: colors.text, fontWeight: '700' }]}>Tự gia hạn ({open.priceCoins} Coin / kỳ)</Text>
              {busy === 'renew' ? (
                <ActivityIndicator color="#10B981" />
              ) : (
                <Switch
                  value={open.autoRenew}
                  onValueChange={(on) => void toggleRenew(on)}
                  trackColor={{ false: '#475569', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              )}
            </View>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{cancelWindowText(open)}</Text>
          </View>
        ) : (
          <View style={[styles.card, card]}>
            <Text style={[styles.planName, { color: colors.text }]}>Bạn đang dùng gói Thường</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              Xem miễn phí các tập đầu của mỗi phim; tập khác mở bằng Coin hoặc bằng gói Tháng.
            </Text>
          </View>
        )}

        {!open && (
          <>
            <Text style={[styles.section, { color: colors.text }]}>Chọn gói</Text>
            {plans === null && <ActivityIndicator color={colors.ruby} />}
            {plans?.length === 0 && <Text style={[styles.meta, { color: colors.textSecondary }]}>Hiện chưa có gói nào được mở bán.</Text>}
            {plans?.map((plan) => (
              <View key={plan.id} style={[styles.card, card, plan.isFeatured && { borderColor: '#E50914', borderWidth: 2 }]}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                  {plan.isFeatured && <Text style={[styles.badge, { color: '#E50914' }]}>Đề xuất</Text>}
                </View>
                {plan.description ? <Text style={[styles.meta, { color: colors.textSecondary }]}>{plan.description}</Text> : null}
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{plan.priceCoins}</Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}> Coin / {plan.durationDays} ngày</Text>
                </View>
                <TouchableOpacity
                  style={[styles.joinBtn, { opacity: busy ? 0.6 : 1 }]}
                  onPress={() => join(plan)}
                  disabled={busy !== null}
                >
                  {busy === plan.id ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.joinText}>Đăng ký với {plan.priceCoins} Coin</Text>}
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100, gap: 12 },
  heading: { fontSize: 22, fontWeight: '900' },
  sub: { fontSize: 13, lineHeight: 18 },
  section: { fontSize: 15, fontWeight: '800', marginTop: 6 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planName: { fontSize: 16, fontWeight: '800' },
  badge: { fontSize: 12, fontWeight: '800' },
  meta: { fontSize: 12, lineHeight: 17 },
  warn: { fontSize: 12, color: '#F59E0B', lineHeight: 17 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  price: { fontSize: 26, fontWeight: '900', color: '#F59E0B' },
  joinBtn: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E50914',
    paddingVertical: 12,
    borderRadius: 10,
  },
  joinText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
