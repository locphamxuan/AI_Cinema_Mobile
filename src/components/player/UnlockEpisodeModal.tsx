import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { episodeAccessService } from '../../services/episodeAccessService';
import { idempotencyKey } from '../../lib/ids';
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
  const { colors, isDark } = useTheme();
  const { setWalletBalance, markEpisodeUnlocked, setTopUpModalOpen } = useAppStore();
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
      setErrorMsg(res.message || 'Mở khóa không thành công.');
      return;
    }
    setWalletBalance(res.data.mainBalance, res.data.bonusBalance);
    markEpisodeUnlocked(episode.id);
    onUnlocked(episode);
    close();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <FontAwesome5 name="lock" size={22} color="#F59E0B" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Tập {episode.episodeNumber}: {episode.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Mở khóa riêng tập này bằng Coin, hoặc đăng ký gói Tháng để xem mọi tập đã phát hành.
          </Text>

          <View style={[styles.priceBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Giá mở khóa</Text>
              <View style={styles.coinBadge}>
                <FontAwesome5 name="coins" size={12} color="#F59E0B" />
                <Text style={styles.coinAmount}>{coinPrice} Coin</Text>
              </View>
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Số dư</Text>
              <Text style={[styles.balanceValue, { color: colors.text }]}>
                {mainBalance} chính · {bonusBalance} thưởng
              </Text>
            </View>
            {enoughCoins ? (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Sẽ trừ</Text>
                <Text style={[styles.balanceValue, { color: '#10B981' }]}>
                  {split.main} Coin chính + {split.bonus} Coin thưởng
                </Text>
              </View>
            ) : (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Còn thiếu</Text>
                <Text style={[styles.balanceValue, { color: '#EF4444' }]}>{missingCoins} Coin</Text>
              </View>
            )}
          </View>

          {errorMsg && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={close} disabled={paying}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Đóng</Text>
            </TouchableOpacity>

            {canBuy && enoughCoins ? (
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.ruby, opacity: paying ? 0.6 : 1 }]}
                onPress={handleUnlock}
                disabled={paying}
              >
                {paying ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmBtnText}>Mở khóa {coinPrice} Coin</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: '#F59E0B' }]}
                onPress={() => {
                  close();
                  setTopUpModalOpen(true);
                }}
              >
                <Text style={styles.confirmBtnText}>Nạp thêm Coin</Text>
              </TouchableOpacity>
            )}
          </View>

          {canJoinPlan && (
            <TouchableOpacity
              style={[
                styles.membershipBtn,
                { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.4)' },
              ]}
              onPress={() => {
                close();
                router.push('/(tabs)/vip');
              }}
            >
              <FontAwesome5 name="crown" size={14} color="#F59E0B" />
              <Text style={styles.membershipBtnText}>
                Gói Tháng{monthlyPlanCoinPrice ? ` · ${monthlyPlanCoinPrice} Coin` : ''} — xem trọn bộ
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center' },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 12, textAlign: 'center', lineHeight: 16, marginBottom: 16 },
  priceBox: { width: '100%', borderRadius: 10, borderWidth: 1, padding: 12, gap: 8, marginBottom: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { fontSize: 12 },
  coinBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coinAmount: { fontSize: 14, fontWeight: '800', color: '#F59E0B' },
  balanceValue: { fontSize: 12, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    width: '100%',
  },
  errorText: { color: '#EF4444', fontSize: 12, flex: 1 },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '600' },
  confirmBtn: { flex: 2, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  confirmBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  membershipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginTop: 10,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
  },
  membershipBtnText: { color: '#F59E0B', fontSize: 13, fontWeight: '700' },
});
