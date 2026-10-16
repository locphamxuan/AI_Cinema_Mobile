import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ScreenHeader } from '../src/components/common/ScreenHeader';
import { MenuCard, MenuRow } from '../src/components/common/MenuRow';
import { Button } from '../src/components/common/Button';
import { StatementList } from '../src/components/wallet/StatementList';
import { fonts, textStyle, useTheme } from '../src/theme';
import { useAppStore } from '../src/store/useAppStore';

/** "Ví Coin": both balances (BR-01), top-up, check-in and the statement. */
export default function WalletScreen() {
  const { colors } = useTheme();
  const { wallet, loadAccountData, setTopUpModalOpen, setCheckInModalOpen } = useAppStore();

  // Balances always come from the BE.
  useEffect(() => {
    void loadAccountData();
  }, [loadAccountData]);

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40, gap: 16, maxWidth: 600, width: '100%', alignSelf: 'center' },
  balance: { marginHorizontal: 16, borderRadius: 18, padding: 20, gap: 16 },
  cols: { flexDirection: 'row', alignItems: 'stretch' },
  col: { flex: 1, gap: 2, paddingHorizontal: 4 },
  amount: { fontFamily: fonts.displayHeavy, fontSize: 40, lineHeight: 44 },
  colLabel: { ...textStyle.labelStrong, fontSize: 14 },
  colNote: { ...textStyle.caption },
  divider: { width: StyleSheet.hairlineWidth, marginHorizontal: 12 },
  rule: { ...textStyle.caption },
  section: { ...textStyle.title, marginHorizontal: 16, marginTop: 8 },
  statement: { paddingHorizontal: 16 },
});
