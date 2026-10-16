import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Modal, Pressable, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { fonts, textStyle, useTheme } from '../../theme';
import { walletService } from '../../services/walletService';
import { Button } from '../common/Button';
import type { PaymentProvider, TopUpOptions, TopUpStatus } from '../../types/episodeAccess';

const PROVIDERS: { id: PaymentProvider; name: string }[] = [
  { id: 'VNPAY', name: 'VNPay' },
  { id: 'MOMO', name: 'MoMo' },
];
const POLL_MS = 2500;
const POLL_LIMIT = 24;
const FINAL: TopUpStatus[] = ['PAID', 'FAILED', 'CANCELLED', 'EXPIRED'];

const STATUS_TEXT: Record<Exclude<TopUpStatus, 'PENDING' | 'PAID'>, string> = {
  FAILED: 'Thanh toán không thành công. Bạn có thể tạo đơn nạp mới.',
  CANCELLED: 'Bạn đã hủy thanh toán.',
  EXPIRED: 'Đơn nạp đã hết hạn. Tạo đơn mới để nạp.',
};

const vnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

/** Main Coins a top-up of `amountVnd` buys at the Admin's rate; the BE credits the same. */
export const coinsFor = (amountVnd: number, rateVnd: number) => (rateVnd > 0 ? Math.floor(amountVnd / rateVnd) : 0);

/** MF-2 top-up: a VNPay / MoMo order; the gateway's IPN credits main Coins, the app waits for it. */
export const TopUpModal: React.FC = () => {
  const insets = useSafeAreaInsets();
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
        setErrorMsg('Chưa nhận được kết quả từ cổng thanh toán. Số dư sẽ tự cập nhật khi cổng xác nhận.');
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
      setErrorMsg(res.message || 'Chưa tạo được đơn nạp. Kiểm tra kết nối rồi thử lại.');
      return;
    }
    // The backend returns to the web wallet page. Keep the auth session open until the member
    // closes that page or a future backend return deep link reaches this app, then reconcile.
    await WebBrowser.openAuthSessionAsync(res.data.redirectUrl, 'aicinema://');
    poll(res.data.topUpId);
  };

  const presets = options ? [options.minVnd, 50_000, 100_000, 200_000].filter((v, i, all) => v >= options.minVnd && v <= options.maxVnd && all.indexOf(v) === i) : [];

  return (
    <Modal visible={isTopUpModalOpen} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <Pressable style={[styles.flex, { backgroundColor: colors.overlay }]} onPress={phase === 'waiting' ? undefined : close} accessibilityLabel="Đóng" />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={[styles.handle, { backgroundColor: colors.borderLight }]} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Nạp Coin</Text>
            <TouchableOpacity onPress={close} hitSlop={10} accessibilityLabel="Đóng">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {phase === 'paid' ? (
            <View style={styles.paid}>
              <Ionicons name="checkmark-circle" size={52} color={colors.verified} />
              <Text style={[styles.paidTitle, { color: colors.text }]}>Đã nạp xong</Text>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Ví hiện có {wallet.mainCoin} Coin chính và {wallet.bonusCoin} Coin thưởng.
              </Text>
              <Button label="Xong" onPress={close} style={styles.fullWidth} />
            </View>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Số tiền nạp</Text>
              <TextInput
                value={amount}
                onChangeText={(value) => setAmount(value.replace(/\D/g, ''))}
                keyboardType="numeric"
                placeholder={options ? `Từ ${vnd(options.minVnd)} đến ${vnd(options.maxVnd)}` : 'Đang tải…'}
                placeholderTextColor={colors.textMuted}
                editable={phase === 'form'}
                style={[styles.amountInput, { backgroundColor: isDark ? colors.cardAlt : colors.card, color: colors.text }]}
              />
              {presets.length > 0 && (
                <View style={styles.presets}>
                  {presets.map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.preset, { backgroundColor: amountVnd === v ? colors.rubySoft : colors.card }]}
                      onPress={() => setAmount(String(v))}
                      disabled={phase !== 'form'}
                    >
                      <Text style={[styles.presetText, { color: amountVnd === v ? colors.ruby : colors.textSecondary }]}>{vnd(v)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {options && amountVnd > 0 && (
                <Text style={[styles.hint, { color: inRange ? colors.textSecondary : colors.danger }]}>
                  {inRange
                    ? `Bạn nhận ${coinsFor(amountVnd, options.rateVnd).toLocaleString('vi-VN')} Coin chính (1 Coin = ${vnd(options.rateVnd)}).`
                    : `Mỗi lần nạp từ ${vnd(options.minVnd)} đến ${vnd(options.maxVnd)}.`}
                </Text>
              )}

              <Text style={[styles.label, { color: colors.textSecondary }]}>Thanh toán qua</Text>
              <View style={styles.methods}>
                {PROVIDERS.map((p) => {
                  const selected = provider === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setProvider(p.id)}
                      disabled={phase !== 'form'}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      style={[styles.method, { backgroundColor: colors.card, borderColor: selected ? colors.ruby : 'transparent' }]}
                    >
                      <Text style={[styles.methodName, { color: colors.text }]}>{p.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {errorMsg && <Text style={[styles.error, { color: colors.danger }]}>{errorMsg}</Text>}

              <Button
                label={phase === 'waiting' ? 'Đang chờ cổng thanh toán…' : inRange ? `Thanh toán ${vnd(amountVnd)}` : 'Thanh toán'}
                onPress={handleTopUp}
                disabled={!inRange || phase !== 'form'}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 10, gap: 10 },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34 },
  label: { ...textStyle.labelStrong, marginTop: 6 },
  amountInput: { fontFamily: fonts.display, fontSize: 24, height: 56, borderRadius: 12, paddingHorizontal: 14 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  presetText: { ...textStyle.labelStrong },
  hint: { ...textStyle.label },
  methods: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  method: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  methodName: { ...textStyle.bodyStrong },
  error: { ...textStyle.label },
  paid: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  paidTitle: { ...textStyle.title, fontSize: 20 },
  fullWidth: { alignSelf: 'stretch', marginTop: 8 },
});
