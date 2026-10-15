import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import type { CheckInResult, DailyRewardStatus } from '../../types/episodeAccess';

/** The BE ladder runs seven streak days, then starts again at day 1. */
const LADDER_LENGTH = 7;

type DayState = 'claimed' | 'next' | 'locked';

/** Each ladder day as the member sees it: what it pays, whether it is done, today, or ahead. */
export function ladderDays(status: DailyRewardStatus | null, claimedDay?: number) {
  const streakDay = claimedDay ?? status?.streakDay ?? 0;
  const doneToday = claimedDay !== undefined || Boolean(status?.checkedInToday);
  const nextDay = doneToday ? null : (streakDay % LADDER_LENGTH) + 1;
  return Array.from({ length: LADDER_LENGTH }, (_, i) => {
    const day = i + 1;
    const rule = status?.ladder.find((r) => r.streakDay === day);
    let state: DayState = 'locked';
    if (day === nextDay) state = 'next';
    else if (day <= streakDay) state = 'claimed';
    return { day, bonusCoins: rule?.bonusCoins ?? 0, grantsSpin: rule?.grantsSpin ?? false, state };
  });
}

/** BR-05: daily check-in pays bonus Coins only; the milestone day of the ladder also grants a spin (BR-09). */
export const CheckInModal: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { isCheckInModalOpen, setCheckInModalOpen, dailyReward, loadDailyReward, claimDailyCheckIn, setRewardSpinOpen } = useAppStore();
  const [claimed, setClaimed] = useState<CheckInResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isCheckInModalOpen) return;
    setStatusLoading(true);
    void loadDailyReward()
      .then((loaded) => { if (!loaded) setErrorMsg('Không tải được trạng thái điểm danh.'); })
      .catch(() => setErrorMsg('Không tải được trạng thái điểm danh.'))
      .finally(() => setStatusLoading(false));
  }, [isCheckInModalOpen, loadDailyReward]);

  const close = () => {
    setClaimed(null);
    setErrorMsg(null);
    setCheckInModalOpen(false);
  };

  const openWheel = () => {
    close();
    setRewardSpinOpen(true);
  };

  const handleClaim = async () => {
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await claimDailyCheckIn();
      if (res.success && res.result) setClaimed(res.result);
      else setErrorMsg(res.error || 'Không điểm danh được.');
    } catch {
      setErrorMsg('Chưa nhận được kết quả điểm danh. Đang kiểm tra lại...');
      try {
        const loaded = await loadDailyReward();
        setErrorMsg(loaded ? null : 'Không tải được trạng thái điểm danh. Hãy thử tải lại.');
      } catch {
        setErrorMsg('Không tải được trạng thái điểm danh. Hãy thử tải lại.');
      }
    } finally {
      setBusy(false);
    }
  };

  const days = ladderDays(dailyReward, claimed?.streakDay);
  const doneToday = Boolean(claimed) || Boolean(dailyReward?.checkedInToday);
  const todayReward = dailyReward?.reward.bonusCoins ?? 0;
  const spins = dailyReward?.availableSpins ?? 0;

  let claimLabel = `Nhận ${todayReward} Coin thưởng`;
  if (statusLoading || (!dailyReward && !errorMsg)) claimLabel = 'Đang tải thông tin...';
  else if (doneToday) claimLabel = 'Đã điểm danh hôm nay';
  else if (dailyReward && todayReward <= 0) claimLabel = 'Hôm nay chưa có phần thưởng';

  return (
    <Modal visible={isCheckInModalOpen} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.fireBadge}>
                <Ionicons name="flame" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Điểm Danh Hằng Ngày</Text>
            </View>
            <TouchableOpacity onPress={close} style={styles.closeBtn} accessibilityLabel="Đóng">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.streakSub, { color: colors.textSecondary }]}>
            Chuỗi hiện tại: {claimed?.streakDay ?? dailyReward?.streakDay ?? 0} ngày. Bỏ một ngày thì chuỗi bắt đầu lại.
          </Text>

          {!dailyReward && !errorMsg && <ActivityIndicator style={{ marginVertical: 24 }} color={colors.ruby} />}

          {dailyReward && (
            <View style={styles.daysRow}>
              {days.map((d) => (
                <View
                  key={d.day}
                  style={[
                    styles.dayCard,
                    {
                      backgroundColor: d.state === 'claimed' ? 'rgba(16, 185, 129, 0.12)' : isDark ? '#131B2E' : '#F8FAFC',
                      borderColor: d.state === 'next' ? colors.ruby : d.state === 'claimed' ? '#10B981' : colors.border,
                      borderWidth: d.state === 'next' ? 2 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.dayLabel, { color: d.state === 'next' ? colors.ruby : colors.textSecondary }]}>N{d.day}</Text>
                  {d.grantsSpin ? (
                    <Ionicons name="gift" size={14} color="#8B5CF6" />
                  ) : (
                    <FontAwesome5 name="coins" size={13} color={d.state === 'claimed' ? '#10B981' : '#F59E0B'} />
                  )}
                  <Text style={[styles.rewardText, { color: colors.text }]}>+{d.bonusCoins}</Text>
                  {d.state === 'claimed' && <Ionicons name="checkmark-circle" size={12} color="#10B981" />}
                </View>
              ))}
            </View>
          )}

          {claimed && (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>Nhận thành công!</Text>
              <Text style={styles.successText}>+{claimed.bonusGranted} Coin thưởng đã vào ví.</Text>
              {claimed.spinGranted && <Text style={styles.spinText}>Ngày mốc: bạn được thêm 1 lượt quay may mắn.</Text>}
            </View>
          )}

          {errorMsg && (
            <View style={styles.errorRow}>
              <Text style={styles.errorText}>{errorMsg}</Text>
              <TouchableOpacity onPress={() => { setErrorMsg(null); setStatusLoading(true); void loadDailyReward().then((loaded) => { if (!loaded) setErrorMsg('Không tải được trạng thái điểm danh.'); }).catch(() => setErrorMsg('Không tải được trạng thái điểm danh.')).finally(() => setStatusLoading(false)); }}>
                <Text style={styles.errorText}>Thử tải lại</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.claimBtn, { backgroundColor: doneToday || todayReward <= 0 ? '#64748B' : colors.ruby }]}
            onPress={handleClaim}
            disabled={statusLoading || busy || !dailyReward || doneToday || todayReward <= 0}
          >
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.claimBtnText}>{claimLabel}</Text>}
          </TouchableOpacity>

          {spins > 0 && (
            <TouchableOpacity style={styles.spinBtn} onPress={openWheel}>
              <Ionicons name="gift" size={14} color="#8B5CF6" />
              <Text style={styles.spinBtnText}>Bạn có {spins} lượt quay — quay ngay</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.footnote, { color: colors.textMuted }]}>
            Coin thưởng có hạn dùng và được trừ sau Coin chính khi mua tập.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  container: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fireBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800' },
  closeBtn: { padding: 4 },
  streakSub: { fontSize: 12, marginBottom: 14 },
  daysRow: { flexDirection: 'row', gap: 4, marginBottom: 14 },
  dayCard: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, gap: 3 },
  dayLabel: { fontSize: 10, fontWeight: '800' },
  rewardText: { fontSize: 11, fontWeight: '800' },
  successBox: { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderRadius: 10, padding: 10, marginBottom: 12, alignItems: 'center' },
  successTitle: { color: '#10B981', fontWeight: '800', fontSize: 14 },
  successText: { color: '#10B981', fontSize: 12, marginTop: 2 },
  spinText: { color: '#8B5CF6', fontSize: 12, fontWeight: '700', marginTop: 4 },
  errorText: { color: '#EF4444', fontSize: 12, marginBottom: 10, textAlign: 'center' },
  errorRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  claimBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  claimBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  spinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  spinBtnText: { color: '#8B5CF6', fontWeight: '800', fontSize: 13 },
  footnote: { fontSize: 11, textAlign: 'center', marginTop: 10 },
});
