import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Episode } from '../../types/movie';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';

interface UnlockEpisodeModalProps {
  visible: boolean;
  onClose: () => void;
  episode: Episode | null;
  onUnlocked: () => void;
}

export const UnlockEpisodeModal: React.FC<UnlockEpisodeModalProps> = ({
  visible,
  onClose,
  episode,
  onUnlocked,
}) => {
  const { colors, isDark } = useTheme();
  const { wallet, unlockEpisode, setTopUpModalOpen } = useAppStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!episode) return null;

  const totalBalance = wallet.mainCoin + wallet.bonusCoin;
  const isEnough = totalBalance >= episode.price;

  const handleUnlock = () => {
    setErrorMsg(null);
    const result = unlockEpisode(episode.id);
    if (result.success) {
      onUnlocked();
      onClose();
    } else {
      setErrorMsg(result.error || 'Mở khóa không thành công.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Icon Header */}
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <FontAwesome5 name="lock-open" size={24} color="#F59E0B" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Mở Khóa Tập {episode.episodeNumber}: {episode.title}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sử dụng Coin để mở khóa quyền xem tập phim AI chất lượng cao không giới hạn.
          </Text>

          {/* Pricing breakdown */}
          <View
            style={[
              styles.priceBox,
              {
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Giá mở khóa:</Text>
              <View style={styles.coinBadge}>
                <FontAwesome5 name="coins" size={12} color="#F59E0B" />
                <Text style={styles.coinAmount}>{episode.price} Coin</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Số dư hiện có:</Text>
              <Text style={[styles.balanceValue, { color: isEnough ? '#10B981' : '#EF4444' }]}>
                {totalBalance} Coin (Chính: {wallet.mainCoin}, Thưởng: {wallet.bonusCoin})
              </Text>
            </View>
          </View>

          {errorMsg && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Đóng</Text>
            </TouchableOpacity>

            {isEnough ? (
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.ruby }]}
                onPress={handleUnlock}
              >
                <Text style={styles.confirmBtnText}>Xác nhận mở khóa</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.topUpBtn, { backgroundColor: '#F59E0B' }]}
                onPress={() => {
                  onClose();
                  setTopUpModalOpen(true);
                }}
              >
                <Text style={styles.topUpBtnText}>Nạp thêm Coin</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  priceBox: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 12,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F59E0B',
  },
  balanceValue: {
    fontSize: 12,
    fontWeight: '700',
  },
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
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  topUpBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  topUpBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
