import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { walletService, STATEMENT_PAGE_SIZE } from '../../services/walletService';
import type { CoinEntryType, StatementLine } from '../../types/episodeAccess';

export const ENTRY_LABEL: Record<CoinEntryType, string> = {
  TOP_UP: 'Nạp Coin',
  EPISODE_PURCHASE: 'Mua tập',
  PLAN_PAYMENT: 'Thanh toán gói',
  PLAN_RENEWAL: 'Gia hạn gói',
  DAILY_REWARD: 'Điểm danh',
  REWARD_SPIN: 'Vòng quay',
  SIGNUP_BONUS: 'Thưởng đăng ký',
  REFUND: 'Hoàn Coin',
  BONUS_EXPIRY: 'Coin thưởng hết hạn',
  ADJUSTMENT: 'Điều chỉnh',
};

const FILTERS: { id: CoinEntryType | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'TOP_UP', label: 'Nạp Coin' },
  { id: 'EPISODE_PURCHASE', label: 'Mua tập' },
  { id: 'PLAN_PAYMENT', label: 'Gói' },
  { id: 'DAILY_REWARD', label: 'Điểm danh' },
  { id: 'REWARD_SPIN', label: 'Vòng quay' },
  { id: 'REFUND', label: 'Hoàn Coin' },
];

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

/** The member's Coin ledger from GET /wallet/statements, newest first, loaded a page at a time. */
export const StatementList: React.FC = () => {
  const { colors, isDark } = useTheme();
  const [filter, setFilter] = useState<CoinEntryType | 'ALL'>('ALL');
  const [lines, setLines] = useState<StatementLine[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      const res = await walletService.getStatements(nextPage, filter === 'ALL' ? undefined : filter);
      setLoading(false);
      if (!res.success || !Array.isArray(res.data)) {
        setErrorMsg(res.message || 'Không tải được lịch sử giao dịch.');
        return;
      }
      setErrorMsg(null);
      setLines((prev) => (nextPage === 1 ? res.data : [...prev, ...res.data]));
      setPage(nextPage);
      setHasMore(res.data.length === STATEMENT_PAGE_SIZE);
    },
    [filter],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((f) => {
          const selected = filter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[
                styles.chip,
                { backgroundColor: selected ? colors.ruby : isDark ? '#1E293B' : '#F1F5F9', borderColor: selected ? colors.ruby : colors.border },
              ]}
            >
              <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.textSecondary }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
      {!loading && !errorMsg && lines.length === 0 && (
        <Text style={[styles.empty, { color: colors.textMuted }]}>Chưa có giao dịch nào.</Text>
      )}

      {lines.map((line) => {
        const total = line.mainAmount + line.bonusAmount;
        const gain = total >= 0;
        return (
          <View key={line.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.icon, { backgroundColor: gain ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)' }]}>
              <Ionicons name={gain ? 'arrow-down' : 'arrow-up'} size={16} color={gain ? '#10B981' : '#EF4444'} />
            </View>
            <View style={styles.info}>
              <Text style={[styles.title, { color: colors.text }]}>{ENTRY_LABEL[line.entryType]}</Text>
              {line.description ? (
                <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={1}>
                  {line.description}
                </Text>
              ) : null}
              <Text style={[styles.desc, { color: colors.textMuted }]}>
                {new Date(line.createdAt).toLocaleString('vi-VN')} · còn {line.mainBalanceAfter} chính / {line.bonusBalanceAfter} thưởng
              </Text>
            </View>
            <View style={styles.amounts}>
              {line.mainAmount !== 0 && (
                <Text style={[styles.amount, { color: line.mainAmount > 0 ? '#10B981' : '#EF4444' }]}>{signed(line.mainAmount)} chính</Text>
              )}
              {line.bonusAmount !== 0 && (
                <Text style={[styles.amount, { color: line.bonusAmount > 0 ? '#8B5CF6' : '#EF4444' }]}>{signed(line.bonusAmount)} thưởng</Text>
              )}
            </View>
          </View>
        );
      })}

      {loading && <ActivityIndicator style={{ marginVertical: 12 }} color={colors.ruby} />}
      {!loading && hasMore && (
        <TouchableOpacity style={[styles.more, { borderColor: colors.border }]} onPress={() => void load(page + 1)}>
          <Text style={[styles.moreText, { color: colors.text }]}>Xem thêm</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  filterRow: { gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '700' },
  error: { color: '#EF4444', fontSize: 12 },
  empty: { fontSize: 12, textAlign: 'center', paddingVertical: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 10 },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 1 },
  title: { fontSize: 13, fontWeight: '800' },
  desc: { fontSize: 11 },
  amounts: { alignItems: 'flex-end' },
  amount: { fontSize: 12, fontWeight: '800' },
  more: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  moreText: { fontSize: 13, fontWeight: '700' },
});
