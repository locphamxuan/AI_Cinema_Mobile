import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeTopBar } from '../../src/components/home/HomeTopBar';
import { HomeTabBar } from '../../src/components/home/HomeTabBar';
import { PosterGrid } from '../../src/components/home/PosterGrid';
import { RankingList } from '../../src/components/home/RankingList';
import { useTheme } from '../../src/theme';
import { useSessionStore, useAccountStore, useCatalogStore, useUiStore, loadInitialData } from '../../src/store';
import { movieService } from '../../src/services';
import { useHomeRecommendations } from '../../src/hooks/useHomeRecommendations';
import { LoadError } from '../../src/components/common/LoadError';
import { ALL_GENRES, collectGenres, filterByGenre, newestFirst, suggestionPage, type HomeTabKey } from '../../src/lib/homeFeed';
import { Movie } from '../../src/types/movie';
import { styles } from '../../src/styles/screens/tabs/index.styles';

const RECOMMEND_SIZE = 9;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isAuthenticated, user } = useSessionStore();
  const { loadDailyReward } = useAccountStore();
  const { movies } = useCatalogStore();
  const recommendations = useHomeRecommendations(isAuthenticated, user?.id);

  const [tab, setTab] = useState<HomeTabKey>('recommend');
  const [genre, setGenre] = useState(ALL_GENRES);
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [ranked, setRanked] = useState<Movie[]>([]);
  const homeTabRequest = useUiStore((s) => s.homeTabRequest);

  // A tab asked for from elsewhere: a member who just opened their account starts on "Phim mới". The tab follows
  // the request while rendering, then the request is used up, so the member can change tabs right after.
  if (homeTabRequest && homeTabRequest !== tab) setTab(homeTabRequest);
  useEffect(() => {
    if (homeTabRequest) useUiStore.getState().takeHomeTabRequest();
  }, [homeTabRequest]);

  const loadRanking = () =>
    movieService.ranking().then((res) => {
      if (res.success) setRanked(res.data);
    });

  useEffect(() => {
    void loadInitialData();
  }, []);

  // Plays change all the time: the ranking is read from the BE each time the tab opens.
  useEffect(() => {
    if (tab === 'ranking') void loadRanking();
  }, [tab]);

  // The gift on the top bar shows whether a check-in or a spin is waiting.
  useEffect(() => {
    if (isAuthenticated) void loadDailyReward();
  }, [isAuthenticated, loadDailyReward]);

  const genres = useMemo(() => [ALL_GENRES, ...collectGenres(movies)], [movies]);
  const newest = useMemo(() => newestFirst(movies), [movies]);
  const byGenre = useMemo(() => filterByGenre(movies, genre), [movies, genre]);

  const pool = recommendations.movies;
  const recommended = useMemo(() => suggestionPage(pool, page, RECOMMEND_SIZE), [pool, page]);
  // Why these picks, in the BE's own words (BR-68), not guessed on the phone.
  const reason = pool.find((movie) => movie.recommendReason)?.recommendReason;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadInitialData(),
      tab === 'ranking' ? loadRanking() : undefined,
      recommendations.reload(),
    ]);
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
        style={[styles.tint, { height: insets.top + 220 }]}
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
            {pool.length > 0 && (
              <View style={styles.recommendHead}>
                <Text style={[styles.recommendTitle, { color: colors.text }]}>
                  {isAuthenticated ? 'Đề xuất dành riêng cho bạn' : 'Đề xuất nổi bật hôm nay'}
                </Text>
                {reason ? <Text style={[styles.recommendNote, { color: colors.textMuted }]}>{reason}</Text> : null}
              </View>
            )}
            {recommendations.error && pool.length === 0 ? (
              <LoadError message={recommendations.error} onRetry={() => void recommendations.reload()} />
            ) : !recommendations.loading && pool.length === 0 && movies.length > 0 ? (
              <View style={styles.emptyBox}>
                <Text style={[styles.empty, styles.emptyInBox, { color: colors.textMuted }]}>
                  Chưa có phim để đề xuất. Xem thử vài phim mới, các đề xuất sẽ hiện ở đây.
                </Text>
                <TouchableOpacity
                  style={[styles.emptyAction, { backgroundColor: colors.ruby }]}
                  onPress={() => setTab('new')}
                  accessibilityRole="button"
                >
                  <Text style={[styles.moreText, { color: colors.white }]}>Xem phim mới</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <PosterGrid movies={recommended} onMoviePress={openMovie} />
            )}
            {pool.length > 0 && (
              <View style={styles.moreRow}>
                <TouchableOpacity style={[styles.moreBtn, { backgroundColor: colors.card }]} onPress={() => setTab('new')}>
                  <Text style={[styles.moreText, { color: colors.textSecondary }]}>Xem thêm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.moreBtn, { backgroundColor: colors.card, opacity: pool.length <= RECOMMEND_SIZE ? 0.45 : 1 }]}
                  onPress={() => setPage((p) => p + 1)}
                  disabled={pool.length <= RECOMMEND_SIZE}
                >
                  <Text style={[styles.moreText, { color: colors.textSecondary }]}>Đổi mới</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {tab === 'ranking' && <RankingList movies={ranked} onMoviePress={openMovie} />}

        {tab === 'new' && <PosterGrid movies={newest} onMoviePress={openMovie} />}

        {tab === 'genre' && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreRow} style={styles.genreScroll}>
              {genres.map((name) => {
                const selected = name === genre;
                return (
                  <TouchableOpacity
                    key={name}
                    onPress={() => setGenre(name)}
                    style={[styles.genrePill, selected && { backgroundColor: colors.rubySoft }]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[selected ? styles.genreOn : styles.genreOff, { color: selected ? colors.ruby : colors.textMuted }]}>
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
          <Text style={[styles.empty, { color: colors.textMuted }]}>Chưa tải được phim. Kéo xuống để thử lại.</Text>
        )}
        {movies.length > 0 && tab === 'genre' && byGenre.length === 0 && (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Thể loại này chưa có phim.</Text>
        )}
      </ScrollView>
    </View>
  );
}
