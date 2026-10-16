import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenHeader } from '../src/components/common/ScreenHeader';
import { MenuCard, MenuRow } from '../src/components/common/MenuRow';
import { StatementList } from '../src/components/wallet/StatementList';
import { useTheme } from '../src/theme';
import { useAppStore } from '../src/store/useAppStore';

/** "Ví của tôi": both balances (BR-01), top-up, check-in and the statement. */
export default function WalletScreen() {
  const { colors } = useTheme();
  const { wallet, loadAccountData, setTopUpModalOpen, setCheckInModalOpen } = useAppStore();

  // Balances always come from the BE.
  useEffect(() => {
    void loadAccountData();
  }, [loadAccountData]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Ví của tôi" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.balance, { backgroundColor: colors.card }]}>
          <View style={styles.cols}>
            <View style={styles.col}>
              <Text style={[styles.colLabel, { color: colors.textSecondary }]}>Coin chính</Text>
              <View style={styles.amountRow}>
                <FontAwesome5 name="coins" size={18} color={colors.coin} />
                <Text style={[styles.amount, { color: colors.text }]}>{wallet.mainCoin}</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.col}>
              <Text style={[styles.colLabel, { color: colors.textSecondary }]}>Coin thưởng</Text>
              <View style={styles.amountRow}>
                <FontAwesome5 name="gift" size={17} color={colors.ruby} />
                <Text style={[styles.amount, { color: colors.text }]}>{wallet.bonusCoin}</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.rule, { color: colors.textMuted }]}>
            Khi mở khóa tập: trừ Coin chính trước, Coin thưởng bù phần còn thiếu.
          </Text>
          <TouchableOpacity activeOpacity={0.85} onPress={() => setTopUpModalOpen(true)}>
            <LinearGradient colors={colors.accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.topUp}>
              <Text style={styles.topUpText}>Nạp Coin</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <MenuCard>
          <MenuRow label="Điểm danh nhận Coin thưởng" onPress={() => setCheckInModalOpen(true)} last />
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
  scroll: { paddingBottom: 40, gap: 16 },
  balance: { marginHorizontal: 16, borderRadius: 18, padding: 20, gap: 16 },
  cols: { flexDirection: 'row', alignItems: 'center' },
  col: { flex: 1, alignItems: 'center', gap: 10 },
  colLabel: { fontSize: 14 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amount: { fontSize: 26, fontWeight: '800' },
  divider: { width: 1, height: 44 },
  rule: { fontSize: 12, textAlign: 'center', lineHeight: 17 },
  topUp: { height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  topUpText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  section: { fontSize: 17, fontWeight: '700', marginHorizontal: 16, marginTop: 4 },
  statement: { paddingHorizontal: 16 },
});
