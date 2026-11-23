import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore, useUiStore } from '../../store';
import { useTheme } from '../../theme';
import { rewardService } from '../../services/rewardService';
import { idempotencyKey } from '../../lib/ids';
import type { RewardPrize, RewardWheelStatus, SpinResult } from '../../types/episodeAccess';
import { styles } from '../../styles/components/wallet/RewardSpinModal.styles';
import { LuckyWheel } from './LuckyWheel';
import { landingRotation, SPIN_TURNS } from './luckyWheelMath';

const SPIN_MS = 4200;
const REDUCED_MS = 400;
const LOAD_ERROR = 'Không tải được vòng quay.';

/** "+20 Coin thưởng (15%)" or "Gói Tháng 30 ngày (2%)"; no percent when the BE sends no chance. */
export const prizeLabel = (p: Pick<RewardPrize, 'type' | 'bonusCoins' | 'planDays' | 'chancePercent'>) => {
  const prize = p.type === 'BONUS_COIN' ? `+${p.bonusCoins} Coin thưởng` : `Gói Tháng ${p.planDays} ngày`;
  return typeof p.chancePercent === 'number' ? `${prize} (${p.chancePercent}%)` : prize;
};

/** Where the result lands: the prize the BE drew, matched by id, else by what it pays. */
export function prizeIndexOf(prizes: RewardPrize[], won: SpinResult['prize']): number {
  const byId = prizes.findIndex((p) => won.id && p.id === won.id);
  if (byId >= 0) return byId;
  return prizes.findIndex((p) => p.type === won.type && p.bonusCoins === won.bonusCoins && p.planDays === won.planDays);
}

const wonText = (won: SpinResult) =>
  won.bonusCoins
    ? `+${won.bonusCoins} Coin thưởng đã vào ví.`
    : `Gói Tháng đã bật${won.planActiveUntil ? `, dùng được đến ${new Date(won.planActiveUntil).toLocaleDateString('vi-VN')}` : ''}.`;

/** BR-09: a milestone check-in earns a spin; the BE draws the prize and pays it out. */
export const RewardSpinModal: React.FC = () => {
  const isOpen = useUiStore((s) => s.isRewardSpinOpen);
  // Mounted only while open, so every opening starts from a fresh load.
  return isOpen ? <SpinDialog /> : null;
};

function SpinDialog() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { setWalletBalance, loadAccountData, loadDailyReward } = useAccountStore();
  const { setRewardSpinOpen } = useUiStore();
  const [wheel, setWheel] = useState<RewardWheelStatus | null>(null);
  const [won, setWon] = useState<SpinResult | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingSpinKey, setPendingSpinKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [turn] = useState(() => new Animated.Value(0));
  const angle = useRef(0);
  const spinRequest = useRef(false);

  const fetchWheel = useCallback(() => {
    void rewardService
      .getWheel()
      .then((res) => {
        if (res.success && res.data) setWheel(res.data);
        else setErrorMsg(res.message || LOAD_ERROR);
      })
      .catch(() => setErrorMsg(LOAD_ERROR))
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchWheel, [fetchWheel]);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled?.()
      .then((reduce) => alive && setReduceMotion(reduce))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const retryWheel = () => {
    setLoading(true);
    setErrorMsg(null);
    fetchWheel();
  };

  const spins = wheel?.availableSpins ?? 0;
  const prizes = wheel?.prizes ?? [];
  const cannotSpin = loading || spinning || (spins <= 0 && !pendingSpinKey) || prizes.length === 0;

  const close = () => {
    if (spinning) return;
    setRewardSpinOpen(false);
    void loadDailyReward();
  };

  const settle = (result: SpinResult) => {
    setSpinning(false);
    setWon(result);
    setWalletBalance(result.mainBalance, result.bonusBalance);
    // Plan days may have started a plan: the BE says whether every episode is open now.
    if (result.planDays) void loadAccountData();
    setWheel((w) => w && { ...w, availableSpins: result.availableSpins, history: [result, ...w.history].slice(0, 10) });
    AccessibilityInfo.announceForAccessibility?.(`Bạn trúng ${result.prize.name}. ${wonText(result)}`);
  };

  /** Turns the wheel a few times, easing out, and stops with the won prize under the pointer. */
  const land = (result: SpinResult) => {
    const index = prizeIndexOf(prizes, result.prize);
    if (index < 0) return settle(result);
    const start = angle.current % 360;
    const end = landingRotation(start, index, prizes.length, reduceMotion ? 0 : SPIN_TURNS, Math.random() - 0.5);
    angle.current = end;
    turn.setValue(start);
    Animated.timing(turn, {
      toValue: end,
      duration: reduceMotion ? REDUCED_MS : SPIN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => settle(result));
  };

  const spin = async () => {
    // A second tap in the same frame would otherwise draw a second key and use a second spin.
    if (cannotSpin || spinRequest.current) return;
    spinRequest.current = true;
    setSpinning(true);
    setErrorMsg(null);
    setWon(null);
    const key = pendingSpinKey ?? idempotencyKey('spin-');
    if (!pendingSpinKey) setPendingSpinKey(key);
    try {
      const res = await rewardService.spin(key);
      if (!res.success || !res.data) {
        setSpinning(false);
        // A plain refusal (no spin left, spin already used) is final: forget the key and show the BE's count again.
        const settled = res.statusCode !== undefined && res.statusCode < 500;
        if (settled) {
          setPendingSpinKey(null);
          fetchWheel();
        }
        setErrorMsg(res.message || 'Chưa quay được. Bấm lại để thử, lượt quay không bị trừ hai lần.');
        return;
      }
      setPendingSpinKey(null);
      land(res.data);
    } catch {
      setSpinning(false);
      setErrorMsg('Chưa nhận được kết quả. Bấm "Xem kết quả" để xem lại lượt vừa quay.');
      try {
        const refreshed = await rewardService.getWheel();
        if (refreshed.success && refreshed.data) setWheel(refreshed.data);
      } catch {
        // Keep the pending key so a retry asks the server for the same result.
      }
    } finally {
      spinRequest.current = false;
    }
  };

  let spinLabel = spins > 0 ? `Quay (còn ${spins} lượt)` : 'Chưa có lượt quay';
  if (loading) spinLabel = 'Đang tải…';
  else if (spinning) spinLabel = 'Đang quay…';
  else if (pendingSpinKey) spinLabel = 'Xem kết quả';
  let lockReason: string | undefined;
  if (!loading && prizes.length === 0) lockReason = 'Vòng quay chưa có giải nào dành cho tài khoản này.';
  else if (!loading && spins <= 0 && !pendingSpinKey && !spinning) {
    lockReason = 'Bạn đang xem trước vòng quay. Điểm danh liên tục tới ngày cuối chuỗi để nhận lượt quay.';
  }
  const wheelSize = Math.min(width - 48, 320);

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
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[styles.spinsLeft, { color: colors.textSecondary }]}>
              {spins > 0 ? `Bạn còn ${spins} lượt quay` : 'Bạn chưa có lượt quay'}
            </Text>
            <LuckyWheel
              prizes={prizes}
              rotation={turn}
              size={wheelSize}
              hubText={pendingSpinKey && !spinning ? 'Xem' : 'Quay'}
              hubLabel={spinLabel}
              hubHint={lockReason}
              disabled={cannotSpin}
              busy={spinning}
              onSpin={() => void spin()}
            />
            {lockReason && <Text style={[styles.note, { color: colors.textMuted }]}>{lockReason}</Text>}

            {won && (
              <View style={[styles.won, { backgroundColor: colors.verifiedSoft }]}>
                <Text style={[styles.wonTitle, { color: colors.text }]}>Bạn trúng {won.prize.name}</Text>
                <Text style={[styles.wonText, { color: colors.textSecondary }]}>{wonText(won)}</Text>
              </View>
            )}

            {errorMsg && (
              <View style={styles.errorRow}>
                <Text style={[styles.error, { color: colors.danger }]}>{errorMsg}</Text>
                {!pendingSpinKey && (
                  <TouchableOpacity onPress={retryWheel} hitSlop={8}>
                    <Text style={[styles.retry, { color: colors.text }]}>Tải lại</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {prizes.length > 0 && (
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
          </ScrollView>
        )}

        {errorMsg && !wheel && (
          <View style={styles.errorRow}>
            <Text style={[styles.error, { color: colors.danger }]}>{errorMsg}</Text>
            <TouchableOpacity onPress={retryWheel} hitSlop={8}>
              <Text style={[styles.retry, { color: colors.text }]}>Tải lại</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}
