import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Modal, Pressable, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore, useUiStore } from '../../store';
import { useTheme } from '../../theme';
import { walletService } from '../../services/walletService';
import { Button } from '../common/Button';
import { topUpCreateFailure, topUpFailureText } from '../../lib/topUps';
import type { TopUpOptions, TopUpStatus } from '../../types/episodeAccess';
import { styles } from '../../styles/components/wallet/TopUpModal.styles';

const POLL_MS = 2500;
const POLL_LIMIT = 24;
const FINAL: TopUpStatus[] = ['PAID', 'FAILED', 'CANCELLED', 'EXPIRED'];

const vnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

/** Main Coins a top-up of `amountVnd` buys at the Admin's rate; the BE credits the same. */
export const coinsFor = (amountVnd: number, rateVnd: number) => (rateVnd > 0 ? Math.floor(amountVnd / rateVnd) : 0);

/** MF-2 top-up: a VNPay order; the gateway's IPN credits main Coins, the app waits for it. */
export const TopUpModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { wallet, loadAccountData } = useAccountStore();
  const { isTopUpModalOpen, setTopUpModalOpen, pendingPurchase } = useUiStore();
  const [options, setOptions] = useState<TopUpOptions | null>(null);
  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState<'form' | 'waiting' | 'paid'>('form');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A second tap in the same frame still sees phase 'form': the ref keeps it to one VNPay order.
  const creating = useRef(false);
  // Bumped when the sheet closes: an order answer or a poll that lands later belongs to a closed sheet and is ignored.
  const opening = useRef(0);
  const [optionsFailed, setOptionsFailed] = useState(false);

  const loadOptions = useCallback(() => {
    void walletService.getTopUpOptions().then((res) => {
      if (res.success && res.data) {
        setErrorMsg(null);
        setOptionsFailed(false);
        return setOptions(res.data);
      }
      setOptionsFailed(true);
      setErrorMsg(res.message || 'Không tải được bảng giá nạp Coin.');
    });
  }, []);
  useEffect(() => {
    if (isTopUpModalOpen) loadOptions();
  }, [isTopUpModalOpen, loadOptions]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const close = () => {
    opening.current += 1;
    if (timer.current) clearTimeout(timer.current);
    setPhase('form');
    setErrorMsg(null);
    setAmount('');
    setTopUpModalOpen(false);
    useUiStore.setState({ pendingPurchase: null });
  };

  /** After a PAID top-up: back to the episode or plan the member was paying for. */
  const resume = () => {
    const intent = useUiStore.getState().pendingPurchase;
    close();
    useUiStore.setState({ resumePurchase: intent });
  };
  const resumeLabel =
    pendingPurchase?.kind === 'episode'
      ? `Quay lại mở ${pendingPurchase.label.charAt(0).toLowerCase()}${pendingPurchase.label.slice(1)}`
      : pendingPurchase?.kind === 'plan'
        ? `Quay lại đăng ký ${pendingPurchase.planName}`
        : null;

  const amountVnd = Number(amount) || 0;
  const inRange = options !== null && amountVnd >= options.minVnd && amountVnd <= options.maxVnd;

  const poll = (topUpId: string, sheet: number, round = 0) => {
    timer.current = setTimeout(async () => {
      const res = await walletService.getTopUp(topUpId);
      if (sheet !== opening.current) return;
      const status = res.success ? res.data?.status : undefined;
      if (status === 'PAID') {
        await loadAccountData();
        setPhase('paid');
      } else if (status && FINAL.includes(status)) {
        setPhase('form');
        setErrorMsg(topUpFailureText(res.data!) ?? 'Thanh toán không thành công. Bạn có thể tạo đơn nạp mới.');
      } else if (round + 1 < POLL_LIMIT) {
        poll(topUpId, sheet, round + 1);
      } else {
        setPhase('form');
        setErrorMsg('Chưa nhận được kết quả từ VNPay. Nếu bạn đã thanh toán, Coin tự vào ví khi VNPay xác nhận; xem trạng thái đơn ở Lịch sử nạp Coin.');
      }
    }, POLL_MS);
  };

  const handleTopUp = async () => {
    if (!inRange || creating.current) return;
    creating.current = true;
    const sheet = opening.current;
    setErrorMsg(null);
    setPhase('waiting');
    const res = await walletService.createTopUp('VNPAY', amountVnd);
    creating.current = false;
    // Closed while the order was being made: it stays pending in Lịch sử nạp Coin, no payment page opens.
    if (sheet !== opening.current) return;
    if (!res.success || !res.data?.redirectUrl) {
      setPhase('form');
      setErrorMsg(topUpCreateFailure(res));
      return;
    }
    // The backend's return trip opens the aicinema:// link, which closes this session; then reconcile.
    if (Platform.OS === 'web') await WebBrowser.openBrowserAsync(res.data.redirectUrl);
    else await WebBrowser.openAuthSessionAsync(res.data.redirectUrl, 'aicinema://');
    if (sheet === opening.current) poll(res.data.topUpId, sheet);
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
              {resumeLabel ? <Button label={resumeLabel} onPress={resume} style={styles.fullWidth} /> : null}
              <Button label="Xong" variant={resumeLabel ? 'quiet' : 'primary'} onPress={close} style={styles.fullWidth} />
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

              <Text style={[styles.label, { color: colors.textSecondary }]}>Thanh toán qua VNPay</Text>

              {errorMsg && <Text style={[styles.error, { color: colors.danger }]}>{errorMsg}</Text>}
              {optionsFailed ? <Button label="Tải lại bảng giá" variant="secondary" onPress={loadOptions} /> : null}

              <Button
                label={phase === 'waiting' ? 'Đang chờ VNPay xác nhận…' : inRange ? `Thanh toán ${vnd(amountVnd)}` : 'Thanh toán'}
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
