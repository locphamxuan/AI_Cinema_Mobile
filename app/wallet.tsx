import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ScrollView } from 'react-native';
import { ScreenHeader } from '../src/components/common/ScreenHeader';
import { MenuCard, MenuRow } from '../src/components/common/MenuRow';
import { Button } from '../src/components/common/Button';
import { StatementList } from '../src/components/wallet/StatementList';
import { useTheme } from '../src/theme';
import { useSessionStore, useAccountStore, useUiStore } from '../src/store';
import { styles } from '../src/styles/screens/wallet.styles';

/** "Ví Coin": both balances (BR-01), top-up, check-in and the statement. */
export default function WalletScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated } = useSessionStore();
  const { wallet, loadAccountData } = useAccountStore();
  const { setTopUpModalOpen, setCheckInModalOpen } = useUiStore();

  // Balances always come from the BE.
  useEffect(() => {
    if (isAuthenticated) void loadAccountData();
  }, [isAuthenticated, loadAccountData]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Ví Coin" />
        <Text style={[styles.rule, { color: colors.textMuted, padding: 24 }]}>Đăng nhập để xem ví Coin.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Ví Coin" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.balance, { backgroundColor: colors.card }]}>
          <View style={styles.cols}>
            <View style={styles.col}>
              <Text style={[styles.amount, { color: colors.coin }]}>{wallet.mainCoin}</Text>
              <Text style={[styles.colLabel, { color: colors.textSecondary }]}>Coin chính</Text>
              <Text style={[styles.colNote, { color: colors.textMuted }]}>Coin bạn nạp bằng tiền</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.col}>
              <Text style={[styles.amount, { color: colors.text }]}>{wallet.bonusCoin}</Text>
              <Text style={[styles.colLabel, { color: colors.textSecondary }]}>Coin thưởng</Text>
              <Text style={[styles.colNote, { color: colors.textMuted }]}>Từ điểm danh, vòng quay; có hạn dùng</Text>
            </View>
          </View>
          <Text style={[styles.rule, { color: colors.textMuted }]}>
            Khi mở tập hoặc trả gói, Coin chính được trừ trước, Coin thưởng bù phần còn thiếu.
          </Text>
          <Button label="Nạp Coin" onPress={() => setTopUpModalOpen(true)} />
        </View>

        <MenuCard>
          <MenuRow icon="receipt-outline" label="Lịch sử nạp Coin" onPress={() => router.push('/top-ups')} />
          <MenuRow icon="gift-outline" label="Điểm danh nhận Coin thưởng" onPress={() => setCheckInModalOpen(true)} last />
        </MenuCard>

        <Text style={[styles.section, { color: colors.text }]}>Lịch sử giao dịch</Text>
        <View style={styles.statement}>
          <StatementList />
        </View>
      </ScrollView>
    </View>
  );
}
