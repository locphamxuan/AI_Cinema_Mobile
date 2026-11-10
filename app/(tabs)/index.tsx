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
import { useSessionStore, useAccountStore, useCatalogStore, loadInitialData } from '../../src/store';
import { movieService } from '../../src/services';
import { savedMovieService } from '../../src/services/savedMovieService';
import { useWatchHistory } from '../../src/hooks/useWatchHistory';
import {
  ALL_GENRES,
  collectGenres,
  filterByGenre,
  newestFirst,
  personalizedRecommendations,
  suggestionPage,
  topPreferredGenres,
  type HomeTabKey,
} from '../../src/lib/homeFeed';
import { Movie } from '../../src/types/movie';
import { styles } from '../../src/styles/screens/tabs/index.styles';

const RECOMMEND_SIZE = 9;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isAuthenticated } = useSessionStore();
  const { loadDailyReward } = useAccountStore();
  const { movies } = useCatalogStore();
  const watchHistory = useWatchHistory(isAuthenticated);

  const [tab, setTab] = useState<HomeTabKey>('recommend');
  const [genre, setGenre] = useState(ALL_GENRES);
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [ranked, setRanked] = useState<Movie[]>([]);
  const [beRecommended, setBeRecommended] = useState<Movie[]>([]);
  const [savedMovieIds, setSavedMovieIds] = useState<string[]>([]);

  const loadRanking = () =>
    movieService.ranking().then((res) => {
      if (res.success) setRanked(res.data);
    });

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    const loadPersonalContext = async () => {
      const [recRes, savedRes] = await Promise.all([
        movieService.recommendations(),
        savedMovieService.list(),
      ]);
      if (!active) return;
      if (recRes.success && recRes.data.length > 0) setBeRecommended(recRes.data);
      if (savedRes.success && Array.isArray(savedRes.data)) {
        setSavedMovieIds(savedRes.data.map((m) => m.id));
      }
    };
    void loadPersonalContext();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

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

  const preferredGenres = useMemo(
    () => (isAuthenticated ? topPreferredGenres(movies, watchHistory, savedMovieIds) : []),
    [isAuthenticated, movies, watchHistory, savedMovieIds],
  );

  const personalizedPool = useMemo(() => {
    if (isAuthenticated && beRecommended.length > 0) return beRecommended;
    return personalizedRecommendations(movies, isAuthenticated ? watchHistory : [], isAuthenticated ? savedMovieIds : []);
  }, [isAuthenticated, beRecommended, movies, watchHistory, savedMovieIds]);

  const recommended = useMemo(() => suggestionPage(personalizedPool, page, RECOMMEND_SIZE), [personalizedPool, page]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadInitialData(),
      tab === 'ranking' ? loadRanking() : undefined,
      isAuthenticated
        ? movieService.recommendations().then((res) => {
            if (res.success && res.data.length > 0) setBeRecommended(res.data);
          })
        : undefined,
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
            {movies.length > 0 && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>
                  {isAuthenticated ? 'Đề xuất dành riêng cho bạn' : 'Đề xuất nổi bật hôm nay'}
                </Text>
                {preferredGenres.length > 0 && (
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    Dựa trên gu phim {preferredGenres.join(', ')} bạn đã xem & lưu
                  </Text>
                )}
              </View>
            )}
            <PosterGrid movies={recommended} onMoviePress={openMovie} />
            {movies.length > 0 && (
              <View style={styles.moreRow}>
                <TouchableOpacity style={[styles.moreBtn, { backgroundColor: colors.card }]} onPress={() => setTab('new')}>
                  <Text style={[styles.moreText, { color: colors.textSecondary }]}>Xem thêm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.moreBtn, { backgroundColor: colors.card, opacity: movies.length <= RECOMMEND_SIZE ? 0.45 : 1 }]}
                  onPress={() => setPage((p) => p + 1)}
                  disabled={movies.length <= RECOMMEND_SIZE}
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
