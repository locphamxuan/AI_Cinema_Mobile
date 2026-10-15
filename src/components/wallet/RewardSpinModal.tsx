import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { rewardService } from '../../services/rewardService';
import { idempotencyKey } from '../../lib/ids';
import type { RewardPrize, RewardWheelStatus, SpinResult } from '../../types/episodeAccess';

const SPIN_MS = 2400;

const prizeLabel =(p: Pick<RewardPrize, 'type' | 'bonusCoins' | 'planDays' | 'chancePercent'>) =>
  `${p.type === 'BONUS_COIN' ? `+${p.bonusCoins} Coin thưởng` : `Gói Tháng ${p.planDays} ngày`} · ${p.chancePercent ?? 0}%`;

/** BR-09: a milestone check-in earns a spin; the BE draws the prize and pays it out. */
export const RewardSpinModal: React.FC = () => {
  const isOpen = useAppStore((s) => s.isRewardSpinOpen);
  // Mounted only while open, so every opening starts from a fresh load.
  return isOpen ? <SpinDialog /> : null;
};

function SpinDialog() {
  const { colors } = useTheme();
  const { setRewardSpinOpen, setWalletBalance, loadAccountData, loadDailyReward } = useAppStore();
  const [wheel, setWheel] = useState<RewardWheelStatus | null>(null);
  const [won, setWon] = useState<SpinResult | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingSpinKey, setPendingSpinKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const turn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    rewardService.getWheel().then((res) => {
      if (res.success && res.data) setWheel(res.data);
      else setErrorMsg(res.message || 'Không tải được vòng quay.');
    }).catch(() => setErrorMsg('Không tải được vòng quay.')).finally(() => setLoading(false));
  }, []);

  const close = () => {
    if (spinning) return;
    setRewardSpinOpen(false);
    void loadDailyReward();
  };

  const spin = async () => {
    if (spinning || (spins <= 0 && !pendingSpinKey) || prizes.length === 0) return;
    setSpinning(true);
    setErrorMsg(null);
    setWon(null);
    const key = pendingSpinKey ?? idempotencyKey('spin-');
    if (!pendingSpinKey) setPendingSpinKey(key);
    try {
      const res = await rewardService.spin(key);
      if (!res.success || !res.data) {
        setSpinning(false);
        setErrorMsg(res.message || 'Không quay được, vui lòng thử lại.');
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
      setErrorMsg('Chưa nhận được kết quả. Hãy thử lại để kiểm tra lượt quay vừa rồi.');
      try {
        const refreshed = await rewardService.getWheel();
        if (refreshed.success && refreshed.data) setWheel(refreshed.data);
      } catch {
        // Keep the pending key so a retry asks the server for the same result.
      }
    }
  };

  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1800deg'] });
  const spins = wheel?.availableSpins ?? 0;
  const prizes = wheel?.prizes ?? [];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Vòng Quay May Mắn</Text>
            <TouchableOpacity onPress={close} disabled={spinning} accessibilityLabel="Đóng">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>{loading ? 'Đang tải lượt quay...' : `Bạn còn ${spins} lượt quay.`}</Text>
          <Text style={[styles.sub, { color: colors.textSecondary, marginTop: 2 }]}>10 ô gồm 9 mức Coin ngẫu nhiên và 1 gói Tháng 30 ngày (tỉ lệ 2%).</Text>

          {loading && <ActivityIndicator style={{ marginVertical: 30 }} color="#8B5CF6" />}

          {wheel && (
            <>
              <Animated.View style={[styles.wheel, { transform: [{ rotate }] }]}>
                <Ionicons name="gift" size={46} color="#FFFFFF" />
              </Animated.View>
              {prizes.length === 0 ? (
                <Text style={[styles.sub, { color: colors.textSecondary, textAlign: 'center' }]}>Chưa có giải thưởng phù hợp cho tài khoản này.</Text>
              ) : (
                <View style={styles.prizeList}>
                  {prizes.map((p) => (
                    <View key={p.id} style={[styles.prizePill, { borderColor: colors.border }]}>
                      <Text style={[styles.prizeText, { color: colors.text }]}>{prizeLabel(p)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {won && (
            <View style={styles.wonBox}>
              <Text style={styles.wonTitle}>Chúc mừng! {won.prize.name}</Text>
              <Text style={styles.wonText}>
                {won.bonusCoins
                  ? `+${won.bonusCoins} Coin thưởng đã vào ví.`
                  : `Chúc mừng! Gói Tháng 30 ngày đã được kích hoạt${won.planActiveUntil ? `, hiệu lực đến ${new Date(won.planActiveUntil).toLocaleDateString('vi-VN')}` : ''}.`}
              </Text>
            </View>
          )}

          {errorMsg && (
            <View style={styles.errorRow}>
              <Text style={styles.errorText}>{errorMsg}</Text>
              {!pendingSpinKey && <TouchableOpacity onPress={() => { setLoading(true); setErrorMsg(null); void rewardService.getWheel().then((res) => { if (res.success && res.data) setWheel(res.data); else setErrorMsg(res.message || 'Không tải được vòng quay.'); }).catch(() => setErrorMsg('Không tải được vòng quay.')).finally(() => setLoading(false)); }}><Text style={styles.errorText}>Thử tải lại</Text></TouchableOpacity>}
            </View>
          )}

          <TouchableOpacity
            style={[styles.spinBtn, { opacity: loading || spinning || (spins <= 0 && !pendingSpinKey) || prizes.length === 0 ? 0.5 : 1 }]}
            onPress={spin}
            disabled={loading || spinning || (spins <= 0 && !pendingSpinKey) || prizes.length === 0}
          >
            <Text style={styles.spinBtnText}>{loading ? 'Đang tải vòng quay...' : spinning ? 'Đang quay...' : pendingSpinKey ? 'Lấy kết quả lần quay' : spins > 0 ? `Quay ngay (${spins})` : 'Hết lượt quay'}</Text>
          </TouchableOpacity>
          {spins <= 0 && !spinning && (
            <Text style={[styles.footnote, { color: colors.textMuted }]}>Điểm danh tới ngày mốc của chuỗi để nhận thêm lượt quay.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  container: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 18, alignItems: 'center' },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '900' },
  sub: { fontSize: 12, marginTop: 4, marginBottom: 12, alignSelf: 'flex-start' },
  wheel: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#7C3AED',
    borderWidth: 6,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  prizeList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 12 },
  prizePill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  prizeText: { fontSize: 11, fontWeight: '700' },
  wonBox: { width: '100%', backgroundColor: 'rgba(16, 185, 129, 0.12)', borderRadius: 10, padding: 10, marginBottom: 12, alignItems: 'center' },
  wonTitle: { color: '#10B981', fontWeight: '800', fontSize: 14, textAlign: 'center' },
  wonText: { color: '#10B981', fontSize: 12, marginTop: 2, textAlign: 'center' },
  errorText: { color: '#EF4444', fontSize: 12, marginBottom: 10, textAlign: 'center' },
  errorRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  spinBtn: { width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#F59E0B' },
  spinBtnText: { color: '#0F172A', fontWeight: '900', fontSize: 14 },
  footnote: { fontSize: 11, textAlign: 'center', marginTop: 8 },
});
