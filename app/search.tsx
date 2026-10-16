import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PosterGrid } from '../src/components/home/PosterGrid';
import { useTheme } from '../src/theme';
import { useAppStore } from '../src/store/useAppStore';
import { movieService } from '../src/services/movieService';
import { STORAGE_KEYS, storage } from '../src/lib/storage';
import { addRecentSearch, suggestionPage } from '../src/lib/homeFeed';
import type { Movie } from '../src/types/movie';

const DEBOUNCE_MS = 350;
const SUGGESTION_SIZE = 6;

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const movies = useAppStore((s) => s.movies);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  const term = query.trim();
  const suggestions = useMemo(() => suggestionPage(movies, page, SUGGESTION_SIZE), [movies, page]);

  useEffect(() => {
    void storage.get<string[]>(STORAGE_KEYS.RECENT_SEARCHES, []).then(setRecent);
  }, []);

  // Search on the server without touching the store, so the home lists stay as they were.
  useEffect(() => {
    if (!term) {
      setResults(null);
      setSearching(false);
      return;
    }
    let active = true;
    setSearching(true);
    const timer = setTimeout(() => {
      void movieService.listMovies({ search: term, limit: 30 }).then((res) => {
        if (!active) return;
        setResults(res.success && Array.isArray(res.data) ? res.data : []);
        setSearching(false);
      });
    }, DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [term]);

  const remember = useCallback(
    (value: string) => {
      const next = addRecentSearch(recent, value);
      setRecent(next);
      void storage.set(STORAGE_KEYS.RECENT_SEARCHES, next);
    },
    [recent],
  );

  const clearRecent = () => {
    setRecent([]);
    void storage.remove(STORAGE_KEYS.RECENT_SEARCHES);
  };

  const openMovie = (movie: Movie) => {
    remember(term || movie.title);
    router.push({ pathname: '/movie/[id]', params: { id: movie.id } });
  };

  const chipBg = isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F2';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 10) }]}>
      <View style={styles.bar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityLabel="Quay lại">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.input, { backgroundColor: chipBg }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => term && remember(term)}
            autoFocus
            returnKeyType="search"
            placeholder="Tìm phim, thể loại..."
            placeholderTextColor={colors.textMuted}
            style={[styles.inputText, { color: colors.text }]}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {term ? (
          searching && results === null ? (
            <Text style={[styles.note, { color: colors.textMuted }]}>Đang tìm...</Text>
          ) : results && results.length > 0 ? (
            <PosterGrid movies={results} onMoviePress={openMovie} />
          ) : (
            <Text style={[styles.note, { color: colors.textMuted }]}>
              Không tìm thấy phim nào khớp với "{term}".
            </Text>
          )
        ) : (
          <>
            {recent.length > 0 && (
              <View style={styles.block}>
                <View style={styles.blockHead}>
                  <Text style={[styles.blockTitle, { color: colors.text }]}>Tìm kiếm gần đây</Text>
                  <TouchableOpacity onPress={clearRecent} hitSlop={8} accessibilityLabel="Xóa lịch sử tìm kiếm">
                    <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.chips}>
                  {recent.map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => setQuery(item)}
                      style={[styles.chip, { backgroundColor: chipBg }]}
                    >
                      <Text style={{ color: colors.text }}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {suggestions.length > 0 && (
              <View style={styles.block}>
                <View style={styles.blockHead}>
                  <Text style={[styles.blockTitle, { color: colors.text }]}>Phim gợi ý</Text>
                  {movies.length > SUGGESTION_SIZE && (
                    <TouchableOpacity onPress={() => setPage((p) => p + 1)} hitSlop={8} accessibilityLabel="Đổi mới">
                      <Ionicons name="refresh" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.gridWrap}>
                  <PosterGrid movies={suggestions} onMoviePress={openMovie} />
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  input: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 14,
  },
  inputText: { flex: 1, fontSize: 14, height: '100%' },
  content: { paddingBottom: 40 },
  note: { textAlign: 'center', marginTop: 48, fontSize: 13 },
  block: { marginTop: 14 },
  blockHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  blockTitle: { fontSize: 16, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 10 },
  chip: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  gridWrap: { marginTop: 12 },
});
