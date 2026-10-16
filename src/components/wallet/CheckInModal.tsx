import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { Button } from '../common/Button';
import type { CheckInResult, DailyRewardStatus } from '../../types/episodeAccess';
import { styles } from '../../styles/components/wallet/CheckInModal.styles';

/** The BE ladder runs seven streak days, then starts again at day 1. */
const LADDER_LENGTH = 7;
const LOAD_ERROR = 'Không tải được lịch điểm danh.';

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
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isCheckInModalOpen, setCheckInModalOpen, dailyReward, loadDailyReward, claimDailyCheckIn, setRewardSpinOpen } = useAppStore();
  const [claimed, setClaimed] = useState<CheckInResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reloadStatus = useCallback(() => {
    setErrorMsg(null);
    setStatusLoading(true);
    return loadDailyReward()
      .then((loaded) => {
        if (!loaded) setErrorMsg(LOAD_ERROR);
        return loaded;
      })
      .catch(() => {
        setErrorMsg(LOAD_ERROR);
        return false;
      })
      .finally(() => setStatusLoading(false));
  }, [loadDailyReward]);

  useEffect(() => {
    if (isCheckInModalOpen) void reloadStatus();
  }, [isCheckInModalOpen, reloadStatus]);

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
      else setErrorMsg(res.error || 'Chưa điểm danh được. Thử lại sau ít phút.');
    } catch {
      // The claim may have gone through; the status from the BE says whether today is done.
      await reloadStatus();
    } finally {
      setBusy(false);
    }
  };

  const days = ladderDays(dailyReward, claimed?.streakDay);
  const doneToday = Boolean(claimed) || Boolean(dailyReward?.checkedInToday);
  const todayReward = dailyReward?.reward.bonusCoins ?? 0;
  const spins = dailyReward?.availableSpins ?? 0;
  const streak = claimed?.streakDay ?? dailyReward?.streakDay ?? 0;

  let claimLabel = `Nhận ${todayReward} Coin thưởng`;
  if (statusLoading || (!dailyReward && !errorMsg)) claimLabel = 'Đang tải…';
  else if (doneToday) claimLabel = 'Hôm nay đã điểm danh';
  else if (dailyReward && todayReward <= 0) claimLabel = 'Hôm nay không có quà điểm danh';

  return (
    <Modal visible={isCheckInModalOpen} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={close} accessibilityLabel="Đóng" />
      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={[styles.handle, { backgroundColor: colors.borderLight }]} />
        <Text style={[styles.title, { color: colors.text }]}>Điểm danh</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          {streak > 0 ? `Bạn đang giữ chuỗi ${streak} ngày. ` : ''}Lỡ một ngày, chuỗi tính lại từ ngày 1.
        </Text>

        {!dailyReward && !errorMsg && <ActivityIndicator style={styles.loading} color={colors.ruby} />}

        {dailyReward && (
          <View style={styles.days}>
            {days.map((d) => {
              const next = d.state === 'next';
              const done = d.state === 'claimed';
              return (
                <View
                  key={d.day}
                  style={[
                    styles.day,
                    { backgroundColor: next ? colors.rubySoft : colors.card, borderColor: next ? colors.ruby : 'transparent' },
                  ]}
                  accessibilityLabel={`Ngày ${d.day}, ${d.bonusCoins} Coin thưởng${d.grantsSpin ? ' và một lượt quay' : ''}${done ? ', đã nhận' : ''}`}
                >
                  <Text style={[styles.dayLabel, { color: next ? colors.ruby : colors.textMuted }]}>Ngày {d.day}</Text>
                  {done ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.verified} />
                  ) : (
                    <Ionicons name={d.grantsSpin ? 'gift' : 'ellipse'} size={d.grantsSpin ? 18 : 14} color={d.grantsSpin ? colors.neon : colors.coin} />
                  )}
                  <Text style={[styles.reward, { color: done ? colors.textMuted : colors.text }]}>+{d.bonusCoins}</Text>
                </View>
              );
            })}
          </View>
        )}

        {claimed && (
          <View style={[styles.done, { backgroundColor: colors.verifiedSoft }]}>
            <Text style={[styles.doneTitle, { color: colors.text }]}>+{claimed.bonusGranted} Coin thưởng đã vào ví</Text>
            {claimed.spinGranted && (
              <Text style={[styles.doneText, { color: colors.textSecondary }]}>Hôm nay là ngày mốc nên bạn có thêm 1 lượt quay.</Text>
            )}
          </View>
        )}

        {errorMsg && (
          <View style={styles.errorRow}>
            <Text style={[styles.error, { color: colors.danger }]}>{errorMsg}</Text>
            <TouchableOpacity onPress={() => void reloadStatus()} hitSlop={8}>
              <Text style={[styles.retry, { color: colors.text }]}>Tải lại</Text>
            </TouchableOpacity>
          </View>
        )}

        <Button
          label={claimLabel}
          onPress={handleClaim}
          loading={busy}
          disabled={statusLoading || !dailyReward || doneToday || todayReward <= 0}
        />

        {spins > 0 && <Button label={`Quay thưởng (còn ${spins} lượt)`} icon="gift-outline" variant="secondary" onPress={openWheel} />}

        <Text style={[styles.footnote, { color: colors.textMuted }]}>Coin thưởng có hạn dùng và được trừ sau Coin chính.</Text>
      </View>
    </Modal>
  );
};
