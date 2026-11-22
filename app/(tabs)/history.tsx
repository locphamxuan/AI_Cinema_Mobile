import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { useSessionStore } from '../../src/store';
import { useTheme } from '../../src/theme';
import { playbackService } from '../../src/services/playbackService';
import { watchProgress } from '../../src/lib/watchHistory';
import type { WatchHistoryEntry } from '../../src/types/playback';
import { styles } from '../../src/styles/screens/tabs/history.styles';

/** "Lịch sử xem": những tập thành viên đã mở, mới nhất trước, kèm tiến độ để xem tiếp. */
export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated } = useSessionStore();
  const [rows, setRows] = useState<WatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    const res = await playbackService.history();
    setLoading(false);
    setRefreshing(false);
    if (res.success && Array.isArray(res.data)) setRows(res.data);
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

  const keyExtractor = (item: WatchHistoryEntry) => `${item.movieId}-${item.episodeId}`;
  const renderItem = ({ item }: { item: WatchHistoryEntry }) => {
    const progress = watchProgress(item);
    const poster = item.thumbnailUrl || undefined;
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() =>
          item.available
            ? router.push({ pathname: '/watch/[id]', params: { id: item.movieId, episodeId: item.episodeId } })
            : null
        }
        accessibilityLabel={`${item.movieTitle}, tập ${item.episodeNumber}`}
        disabled={!item.available}
      >
        {poster ? <View style={[styles.thumb, { backgroundColor: colors.cardAlt }]} /> : null}
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.movieTitle}</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.available ? `Tập ${item.episodeNumber} · ${progress.label}` : item.notice || 'Tập này tạm không xem được'}
          </Text>
        </View>
        <View style={styles.progress}>
          <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.28)' }]}>
            {progress.ratio > 0 && <View style={[styles.fill, { width: `${Math.round(progress.ratio * 100)}%`, backgroundColor: colors.ruby }]} />}
          </View>
          <Text style={[styles.percent, { color: colors.textMuted }]}>{Math.round(progress.ratio * 100)}%</Text>
        </View>
      </TouchableOpacity>
    );
  };

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Lịch sử xem" />
      <FlatList
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ruby} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Bạn chưa xem phim nào. Lịch sử sẽ hiện ở đây.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        style={loading ? { opacity: 0.6 } : undefined}
      />
      {loading && <ActivityIndicator color={colors.ruby} style={styles.loading} />}
    </View>
  );
}
