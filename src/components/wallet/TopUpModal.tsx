import React, { useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { apiClient } from '../../services/apiClient';

const PAYMENT_METHODS = [
  { id: 'vnpay', name: 'VNPay', icon: 'card-outline' },
  { id: 'vietqr', name: 'VietQR', icon: 'qr-code-outline' },
  { id: 'momo', name: 'MoMo', icon: 'wallet-outline' },
  { id: 'zalopay', name: 'ZaloPay', icon: 'flash-outline' },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];

export const TopUpModal: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { isTopUpModalOpen, setTopUpModalOpen, wallet, depositCoins } = useAppStore();

  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('vnpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClose = () => {
    setIsSuccess(false);
    setIsProcessing(false);
    setTopUpModalOpen(false);
  };

  const handleTopUp = async () => {
    const amountVnd = Number(amount);
    if (!Number.isFinite(amountVnd) || amountVnd <= 0) {
      Alert.alert('Số tiền không hợp lệ', 'Nhập số tiền nạp lớn hơn 0.');
      return;
    }
    setIsProcessing(true);

    try {
      const methodName = PAYMENT_METHODS.find((method) => method.id === selectedMethod)?.name || selectedMethod;

      // Nếu là VNPay, thử gọi API tạo URL thanh toán VNPay từ Backend
      if (selectedMethod === 'vnpay') {
        try {
          const res = await apiClient.post('/payment/vnpay/create-url', {
            amount: amountVnd,
            type: 'deposit',
          });

          if (res.success && res.data?.paymentUrl) {
            setIsProcessing(false);
            const result = await WebBrowser.openAuthSessionAsync(
              res.data.paymentUrl,
              'ai-cinemamobile://'
            );
            if (result.type === 'success') {
              setIsSuccess(true);
              return;
            }
          }
        } catch {
          // Fallback sang nạp coin trực tiếp nếu backend VNPay chưa sẵn sàng
        }
      }

      // Xử lý nạp coin tiêu chuẩn
      const success = await depositCoins(amountVnd, methodName);
      setIsProcessing(false);
      if (success) setIsSuccess(true);
      else Alert.alert('Không thể nạp Coin', 'Máy chủ chưa xác nhận giao dịch. Vui lòng thử lại.');
    } catch {
      setIsProcessing(false);
      Alert.alert('Lỗi kết nối', 'Không thể kết nối máy chủ nạp Coin.');
    }
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
              backgroundColor: isDark ? '#121622' : '#FFFFFF',
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
                Yêu cầu nạp {Number(amount).toLocaleString('vi-VN')}đ đã được máy chủ xác nhận.
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
                  <Text style={styles.rewardValueHighlight}>Số dư đã cập nhật</Text>
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

              <Text style={[styles.methodTitle, { color: colors.textSecondary }]}>Số tiền (VND)</Text>
              <TextInput
                value={amount}
                onChangeText={(value) => setAmount(value.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="Nhập số tiền (vd: 50000)"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.amountInput,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
              />

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
                              ? 'rgba(16, 185, 129, 0.2)'
                              : '#ECFDF5'
                            : isDark
                            ? '#1E293B'
                            : '#F8FAFC',
                          borderColor: isSelected ? '#10B981' : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name={method.icon as any}
                        size={16}
                        color={isSelected ? '#10B981' : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.methodText,
                          {
                            color: isSelected ? '#10B981' : colors.text,
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

              {/* Submit button (Green theme) */}
              <TouchableOpacity
                style={[
                  styles.topUpBtn,
                  { backgroundColor: '#10B981', opacity: isProcessing ? 0.7 : 1 },
                ]}
                disabled={isProcessing}
                onPress={handleTopUp}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.topUpBtnText}>
                    Thanh toán {Number(amount || 0).toLocaleString('vi-VN')} đ
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
  amountInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
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
