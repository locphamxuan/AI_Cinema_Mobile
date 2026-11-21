import React, { useRef, useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore, useCatalogStore, useUiStore } from '../../store';
import { useTheme } from '../../theme';
import { episodeAccessService } from '../../services/episodeAccessService';
import { episodeLabel } from '../../lib/episodeLabel';
import { idempotencyKey } from '../../lib/ids';
import { Button } from '../common/Button';
import type { LockedEpisode } from '../../hooks/useEpisodeGate';
import type { Episode } from '../../types/movie';
import { styles } from '../../styles/components/player/UnlockEpisodeModal.styles';

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
  const { setWalletBalance, setOwnedEpisodeIds } = useAccountStore();
  const { markEpisodeUnlocked, currentMovie } = useCatalogStore();
  const { setTopUpModalOpen, setPendingPurchase } = useUiStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  // A ref, not state: a second tap in the same frame sees the first one at once, and both share one key, so the
  // purchase is sent and charged once (BR-01). A retry after a failure reuses the key too.
  const inFlight = useRef(false);
  const key = useRef({ episodeId: '', value: '' });

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
    if (inFlight.current) return;
    inFlight.current = true;
    if (key.current.episodeId !== episode.id) key.current = { episodeId: episode.id, value: idempotencyKey('ep-') };
    setErrorMsg(null);
    setPaying(true);
    const res = await episodeAccessService.purchaseEpisode(episode.id, key.current.value);
    inFlight.current = false;
    setPaying(false);
    if (!res.success || !res.data) {
      setErrorMsg(res.message || 'Chưa mở được tập này. Bấm lại để thử, Coin sẽ không bị trừ hai lần.');
      return;
    }
    setWalletBalance(res.data.mainBalance, res.data.bonusBalance);
    markEpisodeUnlocked(episode.id);
    // Refresh the owned-episode hint so the lock icon disappears on the episode list right away.
    const ownedRes = await episodeAccessService.listOwnedEpisodeIds();
    if (ownedRes.success) {
      setOwnedEpisodeIds(ownedRes.data);
    }
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
              if (locked.gateId) setPendingPurchase({ kind: 'episode', gateId: locked.gateId, episode, label: name });
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
              router.push('/vip');
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
