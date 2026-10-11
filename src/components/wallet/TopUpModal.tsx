import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { walletService } from '../../services/walletService';
import type { PaymentProvider, TopUpOptions, TopUpStatus } from '../../types/episodeAccess';

const PROVIDERS: { id: PaymentProvider; name: string }[] = [
  { id: 'VNPAY', name: 'VNPay' },
  { id: 'MOMO', name: 'MoMo' },
];
const POLL_MS = 2500;
const POLL_LIMIT = 24;
const FINAL: TopUpStatus[] = ['PAID', 'FAILED', 'CANCELLED', 'EXPIRED'];

const STATUS_TEXT: Record<Exclude<TopUpStatus, 'PENDING' | 'PAID'>, string> = {
  FAILED: 'Thanh toán thất bại.',
  CANCELLED: 'Bạn đã huỷ thanh toán.',
  EXPIRED: 'Đơn nạp đã hết hạn.',
};

/** Main Coins a top-up of `amountVnd` buys at the Admin's rate; the BE credits the same. */
export const coinsFor = (amountVnd: number, rateVnd: number) => (rateVnd > 0 ? Math.floor(amountVnd / rateVnd) : 0);

/** MF-2 top-up: a VNPay / MoMo order; the gateway's IPN credits main Coins, the app waits for it. */
export const TopUpModal: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { isTopUpModalOpen, setTopUpModalOpen, wallet, loadAccountData } = useAppStore();
  const [options, setOptions] = useState<TopUpOptions | null>(null);
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState<PaymentProvider>('VNPAY');
  const [phase, setPhase] = useState<'form' | 'waiting' | 'paid'>('form');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isTopUpModalOpen) return;
    walletService.getTopUpOptions().then((res) => {
      if (res.success && res.data) setOptions(res.data);
      else setErrorMsg(res.message || 'Không tải được tỉ giá nạp Coin.');
    });
  }, [isTopUpModalOpen]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    setPhase('form');
    setErrorMsg(null);
    setAmount('');
    setTopUpModalOpen(false);
  };

  const amountVnd = Number(amount) || 0;
  const inRange = options !== null && amountVnd >= options.minVnd && amountVnd <= options.maxVnd;

  const poll = (topUpId: string, round = 0) => {
    timer.current = setTimeout(async () => {
      const res = await walletService.getTopUp(topUpId);
      const status = res.success ? res.data?.status : undefined;
      if (status === 'PAID') {
        await loadAccountData();
        setPhase('paid');
      } else if (status && FINAL.includes(status)) {
        setPhase('form');
        setErrorMsg(STATUS_TEXT[status as keyof typeof STATUS_TEXT]);
      } else if (round + 1 < POLL_LIMIT) {
        poll(topUpId, round + 1);
      } else {
        setPhase('form');
        setErrorMsg('Chưa nhận được kết quả thanh toán. Số dư sẽ tự cập nhật khi cổng thanh toán xác nhận.');
      }
    }, POLL_MS);
  };

  const handleTopUp = async () => {
    if (!inRange) return;
    setErrorMsg(null);
    setPhase('waiting');
    const res = await walletService.createTopUp(provider, amountVnd);
    if (!res.success || !res.data?.redirectUrl) {
      setPhase('form');
      setErrorMsg(res.message || 'Không tạo được đơn nạp Coin.');
      return;
    }
    // The backend returns to the web wallet page. Keep the auth session open until the member
    // closes that page or a future backend return deep link reaches this app, then reconcile.
    await WebBrowser.openAuthSessionAsync(res.data.redirectUrl, 'aicinema://');
    poll(res.data.topUpId);
  };

  return (
    <Modal visible={isTopUpModalOpen} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: isDark ? '#121622' : '#FFFFFF', borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <FontAwesome5 name="coins" size={18} color="#F59E0B" />
              <Text style={[styles.title, { color: colors.text }]}>Nạp Coin</Text>
            </View>
            <TouchableOpacity onPress={close} accessibilityLabel="Đóng">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {phase === 'paid' ? (
            <View style={styles.center}>
              <Ionicons name="checkmark-circle" size={56} color="#10B981" />
              <Text style={[styles.successTitle, { color: colors.text }]}>Nạp Coin thành công</Text>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Số dư: {wallet.mainCoin} Coin chính · {wallet.bonusCoin} Coin thưởng
              </Text>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]} onPress={close}>
                <Text style={styles.actionBtnText}>Xong</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Số tiền (VND)</Text>
              <TextInput
                value={amount}
                onChangeText={(value) => setAmount(value.replace(/\D/g, ''))}
                keyboardType="numeric"
                placeholder={options ? `${options.minVnd.toLocaleString('vi-VN')} – ${options.maxVnd.toLocaleString('vi-VN')}` : 'Đang tải…'}
                placeholderTextColor={colors.textMuted}
                editable={phase === 'form'}
                style={[styles.amountInput, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              />
              {options && amountVnd > 0 && (
                <Text style={[styles.hint, { color: inRange ? '#10B981' : '#EF4444' }]}>
                  {inRange
                    ? `Nhận ${coinsFor(amountVnd, options.rateVnd).toLocaleString('vi-VN')} Coin chính (1 Coin = ${options.rateVnd.toLocaleString('vi-VN')}đ)`
                    : `Mỗi lần nạp từ ${options.minVnd.toLocaleString('vi-VN')}đ đến ${options.maxVnd.toLocaleString('vi-VN')}đ`}
                </Text>
              )}

              <Text style={[styles.label, { color: colors.textSecondary }]}>Cổng thanh toán</Text>
              <View style={styles.methodRow}>
                {PROVIDERS.map((p) => {
                  const selected = provider === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setProvider(p.id)}
                      disabled={phase !== 'form'}
                      style={[styles.methodCard, { borderColor: selected ? '#F59E0B' : colors.border, backgroundColor: selected ? 'rgba(245, 158, 11, 0.1)' : 'transparent' }]}
                    >
                      <Text style={[styles.methodName, { color: colors.text }]}>{p.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#F59E0B', opacity: inRange && phase === 'form' ? 1 : 0.5 }]}
                onPress={handleTopUp}
                disabled={!inRange || phase !== 'form'}
              >
                {phase === 'waiting' ? (
                  <View style={styles.waitingRow}>
                    <ActivityIndicator color="#0F172A" />
                    <Text style={styles.actionBtnTextDark}>Đang chờ cổng thanh toán…</Text>
                  </View>
                ) : (
                  <Text style={styles.actionBtnTextDark}>Thanh toán</Text>
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  container: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 17, fontWeight: '800' },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 6 },
  amountInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 12, marginTop: 6 },
  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  methodCard: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  methodName: { fontSize: 14, fontWeight: '800' },
  errorText: { color: '#EF4444', fontSize: 12, marginBottom: 10 },
  actionBtn: { marginTop: 6, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  actionBtnTextDark: { color: '#0F172A', fontWeight: '800', fontSize: 14 },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  center: { alignItems: 'center', gap: 6 },
  successTitle: { fontSize: 17, fontWeight: '800' },
});
