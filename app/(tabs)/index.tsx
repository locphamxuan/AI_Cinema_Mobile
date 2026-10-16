import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeTopBar } from '../../src/components/home/HomeTopBar';
import { HomeTabBar } from '../../src/components/home/HomeTabBar';
import { PosterGrid } from '../../src/components/home/PosterGrid';
import { RankingList } from '../../src/components/home/RankingList';
import { useTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/useAppStore';
import {
  ALL_GENRES,
  collectGenres,
  filterByGenre,
  newestFirst,
  suggestionPage,
  type HomeTabKey,
} from '../../src/lib/homeFeed';
import { Movie } from '../../src/types/movie';

const RECOMMEND_SIZE = 9;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { movies, loadInitialData, isAuthenticated, loadDailyReward } = useAppStore();

  const [tab, setTab] = useState<HomeTabKey>('recommend');
  const [genre, setGenre] = useState(ALL_GENRES);
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  // The gift on the top bar shows whether a check-in or a spin is waiting.
  useEffect(() => {
    if (isAuthenticated) void loadDailyReward();
  }, [isAuthenticated, loadDailyReward]);

  const genres = useMemo(() => [ALL_GENRES, ...collectGenres(movies)], [movies]);
  const newest = useMemo(() => newestFirst(movies), [movies]);
  const byGenre = useMemo(() => filterByGenre(movies, genre), [movies, genre]);
  const recommended = useMemo(() => suggestionPage(movies, page, RECOMMEND_SIZE), [movies, page]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const openMovie = (movie: Movie) => {
    router.push({ pathname: '/movie/[id]', params: { id: movie.id } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Wine tint behind the search bar and tabs, fading into the page. */}
      <LinearGradient
        colors={[colors.topTint, colors.background]}
        style={[styles.tint, { height: insets.top + 200 }]}
        pointerEvents="none"
      />
      <View style={{ paddingTop: Math.max(insets.top, 10) }}>
        <HomeTopBar hint={movies[0]?.title} />
        <HomeTabBar active={tab} onChange={setTab} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ruby} />}
      >
        {tab === 'recommend' && (
          <>
            <PosterGrid movies={recommended} onMoviePress={openMovie} />
            {movies.length > 0 && (
              <View style={styles.moreRow}>
                <TouchableOpacity
                  style={[styles.moreBtn, { backgroundColor: colors.cardAlt }]}
                  onPress={() => setTab('new')}
                >
                  <Text style={[styles.moreText, { color: colors.textSecondary }]}>Xem thêm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.moreBtn, { backgroundColor: colors.cardAlt }]}
                  onPress={() => setPage((p) => p + 1)}
                  disabled={movies.length <= RECOMMEND_SIZE}
                >
                  <Text style={[styles.moreText, { color: colors.textSecondary }]}>Đổi mới</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {tab === 'ranking' && <RankingList movies={movies} onMoviePress={openMovie} />}

        {tab === 'new' && <PosterGrid movies={newest} onMoviePress={openMovie} />}

        {tab === 'genre' && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.genreRow}
              style={styles.genreScroll}
            >
              {genres.map((name) => {
                const selected = name === genre;
                return (
                  <TouchableOpacity
                    key={name}
                    onPress={() => setGenre(name)}
                    style={[styles.genrePill, selected && { backgroundColor: colors.rubySoft }]}
                  >
                    <Text
                      style={[
                        styles.genreText,
                        { color: selected ? colors.ruby : colors.textMuted, fontWeight: selected ? '800' : '500' },
                      ]}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <PosterGrid movies={byGenre} onMoviePress={openMovie} />
          </>
        )}

        {movies.length === 0 && (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Chưa có phim nào để hiển thị.</Text>
        )}
        {movies.length > 0 && tab === 'genre' && byGenre.length === 0 && (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Chưa có phim thuộc thể loại này.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tint: { position: 'absolute', top: 0, left: 0, right: 0 },
  // Room for the floating tab bar.
  scrollContent: { paddingTop: 4, paddingBottom: 120 },
  moreRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 18 },
  moreBtn: { flex: 1, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontSize: 16, fontWeight: '600' },
  genreScroll: { flexGrow: 0 },
  genreRow: { paddingHorizontal: 16, paddingBottom: 14, gap: 6 },
  genrePill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20 },
  genreText: { fontSize: 15 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 13 },
});
