import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme';
import { walletService, STATEMENT_PAGE_SIZE } from '../../services/walletService';
import { Button } from '../common/Button';
import type { CoinEntryType, StatementLine } from '../../types/episodeAccess';
import { styles } from '../../styles/components/wallet/StatementList.styles';

const ENTRY_LABEL: Record<CoinEntryType, string> = {
  TOP_UP: 'Nạp Coin',
  EPISODE_PURCHASE: 'Mở khóa tập',
  PLAN_PAYMENT: 'Trả Gói Tháng',
  PLAN_RENEWAL: 'Gia hạn Gói Tháng',
  DAILY_REWARD: 'Điểm danh',
  REWARD_SPIN: 'Vòng quay',
  SIGNUP_BONUS: 'Quà chào mừng',
  REFUND: 'Hoàn Coin',
  BONUS_EXPIRY: 'Coin thưởng hết hạn',
  ADJUSTMENT: 'Điều chỉnh',
};

const FILTERS: { id: CoinEntryType | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'TOP_UP', label: 'Nạp' },
  { id: 'EPISODE_PURCHASE', label: 'Mở tập' },
  { id: 'PLAN_PAYMENT', label: 'Gói' },
  { id: 'DAILY_REWARD', label: 'Điểm danh' },
  { id: 'REWARD_SPIN', label: 'Vòng quay' },
  { id: 'REFUND', label: 'Hoàn Coin' },
];

const signed = (n: number) => (n > 0 ? `+${n}` : `−${Math.abs(n)}`);

/** The member's Coin ledger from GET /wallet/statements, newest first, loaded a page at a time. */
export const StatementList: React.FC = () => {
  const { colors } = useTheme();
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
              style={[styles.chip, { backgroundColor: selected ? colors.rubySoft : colors.card }]}
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipText, { color: selected ? colors.ruby : colors.textSecondary }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {errorMsg && <Text style={[styles.note, { color: colors.danger }]}>{errorMsg}</Text>}
      {!loading && !errorMsg && lines.length === 0 && (
        <Text style={[styles.note, { color: colors.textMuted }]}>Chưa có giao dịch nào ở mục này.</Text>
      )}

      {lines.map((line, i) => (
        <View key={line.id} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
          <View style={styles.info}>
            <Text style={[styles.title, { color: colors.text }]}>{ENTRY_LABEL[line.entryType]}</Text>
            {line.description ? (
              <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={1}>
                {line.description}
              </Text>
            ) : null}
            <Text style={[styles.desc, { color: colors.textMuted }]}>
              {new Date(line.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}, sau đó còn{' '}
              {line.mainBalanceAfter} chính, {line.bonusBalanceAfter} thưởng
            </Text>
          </View>
          <View style={styles.amounts}>
            {line.mainAmount !== 0 && (
              <Text style={[styles.amount, { color: line.mainAmount > 0 ? colors.verified : colors.text }]}>{signed(line.mainAmount)} chính</Text>
            )}
            {line.bonusAmount !== 0 && (
              <Text style={[styles.amount, { color: line.bonusAmount > 0 ? colors.verified : colors.text }]}>{signed(line.bonusAmount)} thưởng</Text>
            )}
          </View>
        </View>
      ))}

      {loading && <ActivityIndicator style={styles.loading} color={colors.ruby} />}
      {!loading && hasMore && <Button label="Xem giao dịch cũ hơn" variant="secondary" onPress={() => void load(page + 1)} />}
    </View>
  );
};
