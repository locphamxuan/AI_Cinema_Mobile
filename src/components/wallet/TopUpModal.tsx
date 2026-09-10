import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
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
  { id: 'p1', priceVnd: 50000, mainCoin: 50, bonusCoin: 5 },
  { id: 'p2', priceVnd: 100000, mainCoin: 100, bonusCoin: 15, popular: true },
  { id: 'p3', priceVnd: 200000, mainCoin: 200, bonusCoin: 40 },
  { id: 'p4', priceVnd: 500000, mainCoin: 500, bonusCoin: 120 },
];

export const TopUpModal: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { isTopUpModalOpen, setTopUpModalOpen, wallet, setWalletBalance, addTransaction } =
    useAppStore();

  const [selectedPkg, setSelectedPkg] = useState<CoinPackage>(PACKAGES[1]);
  const [selectedMethod, setSelectedMethod] = useState<'momo' | 'visa' | 'vnpay'>('momo');

  const handleTopUp = () => {
    setWalletBalance(
      wallet.mainCoin + selectedPkg.mainCoin,
      wallet.bonusCoin + selectedPkg.bonusCoin
    );

    addTransaction({
      type: 'deposit',
      typeLabel: 'Nạp Coin',
      description: `Nạp gói ${selectedPkg.priceVnd.toLocaleString('vi-VN')}đ qua ${selectedMethod.toUpperCase()}`,
      mainCoinDelta: selectedPkg.mainCoin,
      bonusCoinDelta: selectedPkg.bonusCoin,
      totalAmount: selectedPkg.mainCoin + selectedPkg.bonusCoin,
      status: 'success',
      statusLabel: 'Thành công',
    });

    Alert.alert(
      'Nạp thành công! 🎉',
      `Đã cộng +${selectedPkg.mainCoin} Coin Chính và +${selectedPkg.bonusCoin} Coin Thưởng vào ví!`
    );

    setTopUpModalOpen(false);
  };

  return (
    <Modal
      visible={isTopUpModalOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setTopUpModalOpen(false)}
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <FontAwesome5 name="coins" size={20} color="#F59E0B" />
              <Text style={[styles.title, { color: colors.text }]}>Nạp Coin Xem Phim</Text>
            </View>
            <TouchableOpacity onPress={() => setTopUpModalOpen(false)} style={styles.closeBtn}>
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
            {(['momo', 'visa', 'vnpay'] as const).map((method) => {
              const isSelected = selectedMethod === method;
              return (
                <TouchableOpacity
                  key={method}
                  activeOpacity={0.8}
                  onPress={() => setSelectedMethod(method)}
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
                  <Text
                    style={[
                      styles.methodText,
                      {
                        color: isSelected ? colors.ruby : colors.text,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {method.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.topUpBtn, { backgroundColor: colors.ruby }]}
            onPress={handleTopUp}
          >
            <Text style={styles.topUpBtnText}>
              Thanh Toán {selectedPkg.priceVnd.toLocaleString('vi-VN')} đ
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 20,
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
    gap: 8,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  methodText: {
    fontSize: 12,
  },
  topUpBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  topUpBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
