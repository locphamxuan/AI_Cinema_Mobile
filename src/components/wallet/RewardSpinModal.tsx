import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { fonts, textStyle, useTheme } from '../../theme';
import { rewardService } from '../../services/rewardService';
import { idempotencyKey } from '../../lib/ids';
import { Button } from '../common/Button';
import type { RewardPrize, RewardWheelStatus, SpinResult } from '../../types/episodeAccess';

const SPIN_MS = 2400;
const LOAD_ERROR = 'Không tải được vòng quay.';

/** "+20 Coin thưởng (15%)" or "Gói Tháng 30 ngày (2%)". */
export const prizeLabel = (p: Pick<RewardPrize, 'type' | 'bonusCoins' | 'planDays' | 'chancePercent'>) =>
  `${p.type === 'BONUS_COIN' ? `+${p.bonusCoins} Coin thưởng` : `Gói Tháng ${p.planDays} ngày`} (${p.chancePercent ?? 0}%)`;

/** BR-09: a milestone check-in earns a spin; the BE draws the prize and pays it out. */
export const RewardSpinModal: React.FC = () => {
  const isOpen = useAppStore((s) => s.isRewardSpinOpen);
  // Mounted only while open, so every opening starts from a fresh load.
  return isOpen ? <SpinDialog /> : null;
};

function SpinDialog() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { setRewardSpinOpen, setWalletBalance, loadAccountData, loadDailyReward } = useAppStore();
  const [wheel, setWheel] = useState<RewardWheelStatus | null>(null);
  const [won, setWon] = useState<SpinResult | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingSpinKey, setPendingSpinKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const turn = useRef(new Animated.Value(0)).current;

  const loadWheel = useCallback(() => {
    setLoading(true);
    setErrorMsg(null);
    void rewardService
      .getWheel()
      .then((res) => {
        if (res.success && res.data) setWheel(res.data);
        else setErrorMsg(res.message || LOAD_ERROR);
      })
      .catch(() => setErrorMsg(LOAD_ERROR))
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadWheel, [loadWheel]);

  const spins = wheel?.availableSpins ?? 0;
  const prizes = wheel?.prizes ?? [];
  const cannotSpin = loading || spinning || (spins <= 0 && !pendingSpinKey) || prizes.length === 0;

  const close = () => {
    if (spinning) return;
    setRewardSpinOpen(false);
    void loadDailyReward();
  };

  const spin = async () => {
    if (cannotSpin) return;
    setSpinning(true);
    setErrorMsg(null);
    setWon(null);
    const key = pendingSpinKey ?? idempotencyKey('spin-');
    if (!pendingSpinKey) setPendingSpinKey(key);
    try {
      const res = await rewardService.spin(key);
      if (!res.success || !res.data) {
        setSpinning(false);
        setErrorMsg(res.message || 'Chưa quay được. Bấm lại để thử, lượt quay không bị trừ hai lần.');
        return;
      }
      setPendingSpinKey(null);
      const result = res.data;
      turn.setValue(0);
      Animated.timing(turn, { toValue: 1, duration: SPIN_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
        setSpinning(false);
        setWon(result);
        setWalletBalance(result.mainBalance, result.bonusBalance);
        // Plan days may have started a plan: the BE says whether every episode is open now.
        if (result.planDays) void loadAccountData();
        setWheel((w) => w && { ...w, availableSpins: result.availableSpins, history: [result, ...w.history].slice(0, 10) });
      });
    } catch {
      setSpinning(false);
      setErrorMsg('Chưa nhận được kết quả. Bấm "Xem kết quả" để hỏi lại lượt vừa quay.');
      try {
        const refreshed = await rewardService.getWheel();
        if (refreshed.success && refreshed.data) setWheel(refreshed.data);
      } catch {
        // Keep the pending key so a retry asks the server for the same result.
      }
    }
  };

  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1800deg'] });

  let spinLabel = spins > 0 ? `Quay (còn ${spins} lượt)` : 'Hết lượt quay';
  if (loading) spinLabel = 'Đang tải…';
  else if (spinning) spinLabel = 'Đang quay…';
  else if (pendingSpinKey) spinLabel = 'Xem kết quả';

  return (
    <Modal visible transparent animationType="slide" onRequestClose={close}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={close} accessibilityLabel="Đóng" />
      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={[styles.handle, { backgroundColor: colors.borderLight }]} />
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Vòng quay</Text>
          <TouchableOpacity onPress={close} disabled={spinning} hitSlop={10} accessibilityLabel="Đóng">
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {loading && !wheel ? <ActivityIndicator style={styles.loading} color={colors.ruby} /> : null}

        {wheel && (
          <>
            <Animated.View style={[styles.wheel, { borderColor: colors.coin, backgroundColor: colors.rubySoft, transform: [{ rotate }] }]}>
              <Ionicons name="gift" size={44} color={colors.ruby} />
            </Animated.View>
            {prizes.length === 0 ? (
              <Text style={[styles.note, { color: colors.textSecondary }]}>Vòng quay chưa có giải nào dành cho tài khoản này.</Text>
            ) : (
              <View style={styles.prizes}>
                <Text style={[styles.prizesTitle, { color: colors.textMuted }]}>Giải có thể trúng</Text>
                <View style={styles.prizeList}>
                  {prizes.map((p) => (
                    <View key={p.id} style={[styles.prize, { backgroundColor: colors.card }]}>
                      <Text style={[styles.prizeText, { color: colors.text }]}>{prizeLabel(p)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {won && (
          <View style={[styles.won, { backgroundColor: colors.verifiedSoft }]}>
            <Text style={[styles.wonTitle, { color: colors.text }]}>Bạn trúng {won.prize.name}</Text>
            <Text style={[styles.wonText, { color: colors.textSecondary }]}>
              {won.bonusCoins
                ? `+${won.bonusCoins} Coin thưởng đã vào ví.`
                : `Gói Tháng đã bật${won.planActiveUntil ? `, dùng được đến ${new Date(won.planActiveUntil).toLocaleDateString('vi-VN')}` : ''}.`}
            </Text>
          </View>
        )}

        {errorMsg && (
          <View style={styles.errorRow}>
            <Text style={[styles.error, { color: colors.danger }]}>{errorMsg}</Text>
            {!pendingSpinKey && (
              <TouchableOpacity onPress={loadWheel} hitSlop={8}>
                <Text style={[styles.retry, { color: colors.text }]}>Tải lại</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Button label={spinLabel} onPress={spin} disabled={cannotSpin} loading={spinning} />
        {spins <= 0 && !spinning && !loading && (
          <Text style={[styles.footnote, { color: colors.textMuted }]}>Điểm danh đủ tới ngày mốc của chuỗi để có thêm lượt quay.</Text>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 10, gap: 14 },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34 },
  loading: { marginVertical: 30 },
  wheel: { alignSelf: 'center', width: 128, height: 128, borderRadius: 64, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  note: { ...textStyle.label, textAlign: 'center' },
  prizes: { gap: 8 },
  prizesTitle: { ...textStyle.labelStrong },
  prizeList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  prize: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  prizeText: { ...textStyle.label },
  won: { borderRadius: 12, padding: 12, gap: 2 },
  wonTitle: { ...textStyle.bodyStrong },
  wonText: { ...textStyle.label },
  errorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  error: { ...textStyle.label, flex: 1 },
  retry: { ...textStyle.labelStrong },
  footnote: { ...textStyle.caption, textAlign: 'center' },
});
