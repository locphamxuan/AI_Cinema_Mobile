import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { showDialog } from '../../src/lib/dialog';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { Button } from '../../src/components/common/Button';
import { useTheme } from '../../src/theme';
import { useAppStore, planIsRunning } from '../../src/store/useAppStore';
import { episodeAccessService } from '../../src/services';
import type { MembershipPlan, MySubscription } from '../../src/types/episodeAccess';
import { styles } from '../../src/styles/screens/tabs/vip.styles';

const formatDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'chưa rõ';

/**
 * BR-30: auto-renew can be stopped until `cancelDeadline` (the renewal date minus the window the
 * Admin sets). Which side of that line the member is on is shown before the switch is used.
 */
export function cancelWindowText(plan: MySubscription, now = Date.now()): string {
  if (!plan.autoRenew) return `Đã tắt tự gia hạn. Gói dừng khi hết kỳ, lúc ${formatDateTime(plan.currentPeriodEnd)}.`;
  if (!plan.cancelDeadline) return 'Gói tự gia hạn khi hết kỳ.';
  return new Date(plan.cancelDeadline).getTime() > now
    ? `Bạn còn tắt được tự gia hạn đến ${formatDateTime(plan.cancelDeadline)}.`
    : 'Đã quá hạn tắt tự gia hạn cho kỳ này, nên lần gia hạn tới vẫn diễn ra.';
}

export default function VipScreen() {
  const { colors } = useTheme();
  const { isAuthenticated, openAuthModal, setTopUpModalOpen, setWalletBalance, loadAccountData, subscription, wallet } = useAppStore();
  const [plans, setPlans] = useState<MembershipPlan[] | null>(null);
  const [plansLoadFailed, setPlansLoadFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const loadPlans = useCallback(() => {
    let active = true;
    setPlans(null);
    setPlansLoadFailed(false);
    void episodeAccessService.getPlans()
      .then((res) => {
        if (!active) return;
        if (!res.success || !Array.isArray(res.data)) {
          setPlans([]);
          setPlansLoadFailed(true);
          return;
        }
        setPlans(res.data.filter((p) => !p.isFree && p.isActive && p.priceCoins !== null));
      })
      .catch(() => {
        if (!active) return;
        setPlans([]);
        setPlansLoadFailed(true);
      });
    return () => { active = false; };
  }, []);

  useFocusEffect(loadPlans);

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
    showDialog(
      `Đăng ký ${plan.name}`,
      `Trừ ${plan.priceCoins} Coin cho ${plan.durationDays} ngày: Coin chính trước, Coin thưởng bù phần còn thiếu. Gói tự gia hạn mỗi kỳ và bạn tắt được trước ngày gia hạn.`,
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
              showDialog('Chưa đăng ký được', res.message || 'Kiểm tra kết nối rồi thử lại.', [
                { text: 'Đóng', style: 'cancel' },
                ...(short ? [{ text: 'Nạp Coin', onPress: () => setTopUpModalOpen(true) }] : []),
              ]);
              return;
            }
            setWalletBalance(res.data.mainBalance, res.data.bonusBalance);
            await reload();
            showDialog('Đã kích hoạt', `${plan.name} dùng được đến ${formatDateTime(res.data.currentPeriodEnd)}.`);
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
      showDialog('Chưa đổi được', res.message || 'Kiểm tra kết nối rồi thử lại.');
      return;
    }
    await reload();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Gói Tháng" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {open ? (
          <>
            <LinearGradient colors={colors.vipGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pass}>
              <Text style={[styles.passName, { color: colors.vipText }]}>{open.plan.name}</Text>
              <Text style={[styles.passLine, { color: colors.vipText }]}>
                {running ? `Dùng được đến ${formatDateTime(open.currentPeriodEnd)}` : 'Chưa gia hạn được kỳ này'}
              </Text>
            </LinearGradient>

            {open.status === 'PAST_DUE' && (
              <View style={[styles.notice, { backgroundColor: colors.coinSoft }]}>
                <Text style={[styles.noticeText, { color: colors.text }]}>
                  Lần gia hạn vừa rồi thiếu Coin. Nạp thêm Coin, hệ thống sẽ tự thử lại. Trong lúc chờ, các tập khóa cần mở bằng Coin.
                </Text>
                <Button label="Nạp Coin" onPress={() => setTopUpModalOpen(true)} style={styles.noticeBtn} />
              </View>
            )}

            <View style={[styles.renew, { backgroundColor: colors.card }]}>
              <View style={styles.renewRow}>
                <View style={styles.renewText}>
                  <Text style={[styles.renewTitle, { color: colors.text }]}>Tự gia hạn</Text>
                  <Text style={[styles.renewPrice, { color: colors.textMuted }]}>{open.priceCoins} Coin mỗi kỳ</Text>
                </View>
                {busy === 'renew' ? (
                  <ActivityIndicator color={colors.ruby} />
                ) : (
                  <Switch
                    value={open.autoRenew}
                    onValueChange={(on) => void toggleRenew(on)}
                    trackColor={{ false: colors.borderLight, true: colors.ruby }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel="Tự gia hạn"
                  />
                )}
              </View>
              <Text style={[styles.window, { color: colors.textSecondary }]}>{cancelWindowText(open)}</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.lead, { color: colors.text }]}>
              Một lần trả bằng Coin, xem mọi tập đã phát hành trong suốt kỳ của gói.
            </Text>
            {isAuthenticated && (
              <Text style={[styles.balance, { color: colors.textMuted }]}>
                Trong ví: {wallet.mainCoin} Coin chính, {wallet.bonusCoin} Coin thưởng
              </Text>
            )}

            {plans === null && <ActivityIndicator color={colors.ruby} style={styles.loading} />}
            {plansLoadFailed ? (
              <View style={styles.failed}>
                <Text style={[styles.window, { color: colors.textSecondary }]}>Không tải được danh sách gói.</Text>
                <Button label="Tải lại" variant="secondary" onPress={loadPlans} style={styles.retry} />
              </View>
            ) : plans?.length === 0 ? (
              <Text style={[styles.window, { color: colors.textSecondary }]}>Hiện chưa có gói nào mở bán.</Text>
            ) : null}

            {plans?.map((plan) => (
              <View
                key={plan.id}
                style={[styles.plan, { backgroundColor: colors.card, borderColor: plan.isFeatured ? colors.ruby : 'transparent' }]}
              >
                <View style={styles.planHead}>
                  <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                  {plan.isFeatured && <Text style={[styles.featured, { color: colors.ruby }]}>Đề xuất</Text>}
                </View>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, { color: colors.text }]}>{plan.priceCoins}</Text>
                  <Text style={[styles.per, { color: colors.textMuted }]}>Coin cho {plan.durationDays} ngày</Text>
                </View>
                {plan.description ? <Text style={[styles.desc, { color: colors.textSecondary }]}>{plan.description}</Text> : null}
                <Button
                  label="Đăng ký"
                  variant={plan.isFeatured ? 'primary' : 'secondary'}
                  onPress={() => join(plan)}
                  loading={busy === plan.id}
                  disabled={busy !== null && busy !== plan.id}
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
