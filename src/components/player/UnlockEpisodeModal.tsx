import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { fonts, textStyle, useTheme } from '../../theme';
import { episodeAccessService } from '../../services/episodeAccessService';
import { episodeLabel } from '../../lib/episodeLabel';
import { idempotencyKey } from '../../lib/ids';
import { Button } from '../common/Button';
import type { LockedEpisode } from '../../hooks/useEpisodeGate';
import type { Episode } from '../../types/movie';

interface UnlockEpisodeModalProps {
  /** The episode the BE refused, with its decision; null hides the modal. */
  locked: LockedEpisode | null;
  onClose: () => void;
  onUnlocked: (episode: Episode) => void;
}

/** Main Coins pay first, bonus Coins cover the rest (BR-01); shown before the member confirms. */
export function splitPrice(price: number, mainCoin: number) {
  const main = Math.min(mainCoin, price);
  return { main, bonus: price - main };
}

export const UnlockEpisodeModal: React.FC<UnlockEpisodeModalProps> = ({ locked, onClose, onUnlocked }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { setWalletBalance, markEpisodeUnlocked, setTopUpModalOpen, currentMovie } = useAppStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  // One key per opened episode: a double tap or a retry is charged once.
  const [key, setKey] = useState({ episodeId: '', value: '' });

  if (!locked) return null;
  const { episode, decision } = locked;
  const { coinPrice, mainBalance = 0, bonusBalance = 0, enoughCoins = false, missingCoins = 0, monthlyPlanCoinPrice } = decision.required;
  const canBuy = decision.accessMethods.includes('UNLOCK_EPISODE');
  const canJoinPlan = decision.accessMethods.includes('MONTHLY_PLAN');
  const split = splitPrice(coinPrice, mainBalance);
  const named = episode.title && episode.title !== `Tập ${episode.episodeNumber}`;
  const siblings = currentMovie?.episodes?.some((ep) => ep.id === episode.id) ? currentMovie.episodes : null;
  const name = siblings ? episodeLabel(episode, siblings) : `Tập ${episode.episodeNumber}`;

  const close = () => {
    setErrorMsg(null);
    onClose();
  };

  const handleUnlock = async () => {
    setErrorMsg(null);
    setPaying(true);
    const value = key.episodeId === episode.id ? key.value : idempotencyKey('ep-');
    setKey({ episodeId: episode.id, value });
    const res = await episodeAccessService.purchaseEpisode(episode.id, value);
    setPaying(false);
    if (!res.success || !res.data) {
      setErrorMsg(res.message || 'Chưa mở được tập này. Bấm lại để thử, Coin sẽ không bị trừ hai lần.');
      return;
    }
    setWalletBalance(res.data.mainBalance, res.data.bonusBalance);
    markEpisodeUnlocked(episode.id);
    onUnlocked(episode);
    close();
  };

  const line = (label: string, value: string, tone?: string) => (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.lineValue, { color: tone ?? colors.text }]}>{value}</Text>
    </View>
  );

  return (
    <Modal visible transparent animationType="slide" onRequestClose={close}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={paying ? undefined : close} accessibilityLabel="Đóng" />
      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={[styles.handle, { backgroundColor: colors.borderLight }]} />
        <Text style={[styles.kicker, { color: colors.textMuted }]}>Mở khóa {name.charAt(0).toLowerCase() + name.slice(1)}</Text>
        {named ? <Text style={[styles.episodeName, { color: colors.text }]}>{episode.title}</Text> : null}

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.text }]}>{coinPrice}</Text>
          <Text style={[styles.priceUnit, { color: colors.textSecondary }]}>Coin</Text>
        </View>

        <View style={[styles.breakdown, { backgroundColor: colors.card }]}>
          {enoughCoins ? (
            <>
              {line('Trừ Coin chính', `${split.main}`)}
              {line('Trừ Coin thưởng', `${split.bonus}`)}
              <View style={[styles.rule, { backgroundColor: colors.border }]} />
              {line('Còn lại', `${mainBalance - split.main} chính, ${bonusBalance - split.bonus} thưởng`, colors.textSecondary)}
            </>
          ) : (
            <>
              {line('Trong ví', `${mainBalance} chính, ${bonusBalance} thưởng`)}
              {line('Còn thiếu', `${missingCoins} Coin`, colors.danger)}
            </>
          )}
        </View>
        <Text style={[styles.rulesNote, { color: colors.textMuted }]}>Coin chính được trừ trước, Coin thưởng bù phần còn thiếu.</Text>

        {errorMsg && <Text style={[styles.error, { color: colors.danger }]}>{errorMsg}</Text>}

        {canBuy && enoughCoins ? (
          <Button label={`Mở khóa với ${coinPrice} Coin`} onPress={handleUnlock} loading={paying} />
        ) : (
          <Button
            label="Nạp Coin"
            onPress={() => {
              close();
              setTopUpModalOpen(true);
            }}
          />
        )}

        {canJoinPlan && (
          <TouchableOpacity
            style={styles.planLink}
            disabled={paying}
            onPress={() => {
              close();
              router.push('/(tabs)/vip');
            }}
          >
            <Text style={[styles.planText, { color: colors.textSecondary }]}>
              Hoặc dùng Gói Tháng{monthlyPlanCoinPrice ? ` (${monthlyPlanCoinPrice} Coin)` : ''} để xem mọi tập
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 10, gap: 12 },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: 4 },
  kicker: { ...textStyle.labelStrong },
  episodeName: { ...textStyle.title, marginTop: -6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { fontFamily: fonts.displayHeavy, fontSize: 48, lineHeight: 52 },
  priceUnit: { ...textStyle.title },
  breakdown: { borderRadius: 14, padding: 14, gap: 10 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  lineLabel: { ...textStyle.label, fontSize: 14 },
  lineValue: { ...textStyle.bodyStrong, fontSize: 14 },
  rule: { height: StyleSheet.hairlineWidth },
  rulesNote: { ...textStyle.caption, marginTop: -4 },
  error: { ...textStyle.label },
  planLink: { alignItems: 'center', paddingVertical: 8 },
  planText: { ...textStyle.labelStrong, textDecorationLine: 'underline' },
});
