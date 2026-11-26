import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { HistoryCard } from '../../src/components/history/HistoryCard';
import { useCatalogStore, useSessionStore } from '../../src/store';
import { useTheme } from '../../src/theme';
import { playbackService } from '../../src/services/playbackService';
import type { WatchHistoryEntry } from '../../src/types/playback';
import { styles } from '../../src/styles/screens/tabs/history.styles';

/** "Lịch sử xem": những tập thành viên đã mở, mới nhất trước, kèm tiến độ để xem tiếp. */
export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated } = useSessionStore();
  const { movies } = useCatalogStore();
  const [rows, setRows] = useState<WatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    const res = await playbackService.history();
    setLoading(false);
    setRefreshing(false);
    if (res.success && Array.isArray(res.data)) {
      setRows(res.data);
      setError(null);
    } else {
      setError(res.message || 'Chưa tải được lịch sử xem.');
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
  };

  // Resumes where the member stopped: the player reads the saved position of this episode from the BE.
  const open = (item: WatchHistoryEntry) =>
    router.push({ pathname: '/watch/[id]', params: { id: item.movieId, episodeId: item.episodeId } });
  const posterOf = (movieId: string) => movies.find((m) => m.id === movieId)?.posterUrl || undefined;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Lịch sử xem" />
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Đăng nhập để xem lịch sử phim của bạn.</Text>
        </View>
      </View>
    );
  }

  const firstLoad = loading && rows.length === 0 && !error;
  const empty = firstLoad ? undefined : error && rows.length === 0 ? (
    <View style={styles.empty}>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
      <TouchableOpacity style={[styles.retry, { backgroundColor: colors.ruby }]} onPress={() => void load()} accessibilityRole="button">
        <Text style={[styles.retryText, { color: colors.white }]}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={styles.empty}>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>Bạn chưa xem phim nào. Lịch sử sẽ hiện ở đây.</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Lịch sử xem" />
      <FlatList
        data={rows}
        keyExtractor={(item) => `${item.movieId}-${item.episodeId}`}
        renderItem={({ item }) => <HistoryCard item={item} poster={posterOf(item.movieId)} onOpen={open} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ruby} />}
        ListEmptyComponent={empty}
        showsVerticalScrollIndicator={false}
        style={loading && rows.length > 0 ? { opacity: 0.6 } : undefined}
      />
      {loading && !refreshing && (
        <ActivityIndicator color={colors.ruby} style={styles.loading} accessibilityLabel="Đang tải lịch sử xem" />
      )}
    </View>
  );
}
