import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../src/components/common/Header';
import { HeroBanner } from '../../src/components/home/HeroBanner';
import { ContinueWatchingSection } from '../../src/components/home/ContinueWatchingSection';
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
  type HomeTabKey,
} from '../../src/lib/homeFeed';
import { Movie } from '../../src/types/movie';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { movies, loadInitialData } = useAppStore();

  const [tab, setTab] = useState<HomeTabKey>('recommend');
  const [genre, setGenre] = useState(ALL_GENRES);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const genres = useMemo(() => [ALL_GENRES, ...collectGenres(movies)], [movies]);
  const newest = useMemo(() => newestFirst(movies), [movies]);
  const byGenre = useMemo(() => filterByGenre(movies, genre), [movies, genre]);

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
      <Header onProfilePress={() => router.push('/profile')} />

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/search')}
        style={[styles.search, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}
        accessibilityRole="search"
        accessibilityLabel="Tìm kiếm phim"
      >
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <Text style={[styles.searchText, { color: colors.textMuted }]}>Tìm phim, thể loại...</Text>
      </TouchableOpacity>

      <HomeTabBar active={tab} onChange={setTab} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ruby} />}
      >
        {tab === 'recommend' && (
          <>
            <HeroBanner movies={movies.slice(0, 5)} onPlayPress={openMovie} onDetailPress={openMovie} />
            <ContinueWatchingSection />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Danh sách phim</Text>
            <PosterGrid movies={movies} onMoviePress={openMovie} />
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
                    style={[
                      styles.genrePill,
                      {
                        backgroundColor: selected ? colors.ruby : isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                      },
                    ]}
                  >
                    <Text style={{ color: selected ? '#FFFFFF' : colors.text, fontWeight: selected ? '800' : '600' }}>
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
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 10,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 14,
  },
  searchText: { fontSize: 14 },
  // Room for the floating tab bar.
  scrollContent: { paddingBottom: 120 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginHorizontal: 16, marginTop: 14, marginBottom: 10 },
  genreScroll: { flexGrow: 0 },
  genreRow: { paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  genrePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 13 },
});
