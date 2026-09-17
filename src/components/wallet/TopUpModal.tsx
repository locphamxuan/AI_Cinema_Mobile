import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';

interface CoinPackage {
  id: string;
  priceVnd: number;
  mainCoin: number;
  bonusCoin: number;
  popular?: boolean;
}

const PACKAGES: CoinPackage[] = [
  { id: 'p1', priceVnd: 50000, mainCoin: 100, bonusCoin: 20 },
  { id: 'p2', priceVnd: 100000, mainCoin: 220, bonusCoin: 50, popular: true },
  { id: 'p3', priceVnd: 200000, mainCoin: 480, bonusCoin: 120 },
  { id: 'p4', priceVnd: 500000, mainCoin: 1300, bonusCoin: 350 },
];

const PAYMENT_METHODS = [
  { id: 'vietqr', name: 'VietQR', icon: 'qr-code-outline' },
  { id: 'momo', name: 'MoMo', icon: 'wallet-outline' },
  { id: 'zalopay', name: 'ZaloPay', icon: 'flash-outline' },
  { id: 'card', name: 'Visa/Master', icon: 'card-outline' },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];

export const TopUpModal: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { isTopUpModalOpen, setTopUpModalOpen, wallet, depositCoins } = useAppStore();

  const [selectedPkg, setSelectedPkg] = useState<CoinPackage>(PACKAGES[1]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('vietqr');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClose = () => {
    setIsSuccess(false);
    setIsProcessing(false);
    setTopUpModalOpen(false);
  };

  const handleTopUp = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const methodName = PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.name || selectedMethod;
      depositCoins(selectedPkg.priceVnd, selectedPkg.mainCoin, selectedPkg.bonusCoin, methodName);
      setIsProcessing(false);
      setIsSuccess(true);
    }, 800);
  };

  return (
    <Modal
      visible={isTopUpModalOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
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
          {isSuccess ? (
            /* Success View */
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-circle" size={60} color="#10B981" />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>
                Nạp Coin Thành Công! 🎉
              </Text>
              <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                Gói {selectedPkg.priceVnd.toLocaleString('vi-VN')}đ đã được thanh toán
              </Text>

              <View
                style={[
                  styles.rewardCard,
                  {
                    backgroundColor: isDark ? '#064E3B20' : '#ECFDF5',
                    borderColor: '#10B98140',
                  },
                ]}
              >
                <View style={styles.rewardRow}>
                  <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>Coin nhận được:</Text>
                  <Text style={styles.rewardValueHighlight}>
                    +{selectedPkg.mainCoin + selectedPkg.bonusCoin} Coin
                  </Text>
                </View>
                <View style={styles.rewardRow}>
                  <Text style={[styles.rewardSubLabel, { color: colors.textMuted }]}>
                    ({selectedPkg.mainCoin} chính + {selectedPkg.bonusCoin} thưởng)
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.rewardRow}>
                  <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>Số dư ví hiện tại:</Text>
                  <Text style={[styles.walletTotal, { color: colors.text }]}>
                    {wallet.mainCoin} chính / {wallet.bonusCoin} thưởng
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                onPress={handleClose}
              >
                <Text style={styles.actionBtnText}>Xong</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Normal TopUp Form */
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <FontAwesome5 name="coins" size={20} color="#F59E0B" />
                  <Text style={[styles.title, { color: colors.text }]}>Nạp Coin Xem Phim</Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Package list */}
              <View style={styles.packageList}>
                {PACKAGES.map((pkg) => {
                  const isSelected = selectedPkg.id === pkg.id;
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      activeOpacity={0.85}
                      onPress={() => setSelectedPkg(pkg)}
                      style={[
                        styles.packageCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? '#1E293B'
                              : '#EFF6FF'
                            : isDark
                            ? '#131B2E'
                            : '#F8FAFC',
                          borderColor: isSelected ? colors.ruby : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <View>
                        <View style={styles.coinAmountRow}>
                          <FontAwesome5 name="coins" size={13} color="#F59E0B" />
                          <Text style={[styles.coinText, { color: colors.text }]}>
                            {pkg.mainCoin} Coin
                          </Text>
                          {pkg.bonusCoin > 0 && (
                            <View style={styles.bonusBadge}>
                              <Text style={styles.bonusBadgeText}>+{pkg.bonusCoin} thưởng</Text>
                            </View>
                          )}
                          {pkg.popular && (
                            <View style={styles.hotBadge}>
                              <Text style={styles.hotBadgeText}>Phổ biến</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.vndText, { color: colors.textSecondary }]}>
                          {pkg.priceVnd.toLocaleString('vi-VN')} đ
                        </Text>
                      </View>

                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={isSelected ? colors.ruby : colors.textMuted}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Payment Method Selector */}
              <Text style={[styles.methodTitle, { color: colors.textSecondary }]}>
                Phương thức thanh toán:
              </Text>
              <View style={styles.methodRow}>
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = selectedMethod === method.id;
                  return (
                    <TouchableOpacity
                      key={method.id}
                      activeOpacity={0.8}
                      onPress={() => setSelectedMethod(method.id)}
                      style={[
                        styles.methodBtn,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? '#1E293B'
                              : '#EFF6FF'
                            : isDark
                            ? '#131B2E'
                            : '#F8FAFC',
                          borderColor: isSelected ? colors.ruby : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name={method.icon as any}
                        size={16}
                        color={isSelected ? colors.ruby : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.methodText,
                          {
                            color: isSelected ? colors.ruby : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {method.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Submit button */}
              <TouchableOpacity
                style={[
                  styles.topUpBtn,
                  { backgroundColor: colors.ruby, opacity: isProcessing ? 0.7 : 1 },
                ]}
                disabled={isProcessing}
                onPress={handleTopUp}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.topUpBtnText}>
                    Thanh Toán {selectedPkg.priceVnd.toLocaleString('vi-VN')} đ
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 20,
    paddingBottom: 28,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  packageList: {
    gap: 8,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
  },
  coinAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinText: {
    fontSize: 14,
    fontWeight: '800',
  },
  bonusBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bonusBadgeText: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: '700',
  },
  hotBadge: {
    backgroundColor: '#EF444420',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hotBadgeText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
  vndText: {
    fontSize: 12,
    marginTop: 2,
  },
  methodTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 6,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  methodText: {
    fontSize: 11,
  },
  topUpBtn: {
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  topUpBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Success state styles
  successContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  successIconCircle: {
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  rewardCard: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 6,
    gap: 6,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 13,
  },
  rewardSubLabel: {
    fontSize: 11,
  },
  rewardValueHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  walletTotal: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
