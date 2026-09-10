import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../src/components/common/Header';
import { MovieCard } from '../../src/components/home/MovieCard';
import { useTheme } from '../../src/theme';
import { allMockMovies, genreCategories } from '../../src/mocks/mockData';
import { Movie } from '../../src/types/movie';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export default function ExploreScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('Tất cả');

  const filteredMovies = allMockMovies.filter((movie) => {
    const matchesQuery =
      movie.title.toLowerCase().includes(query.toLowerCase()) ||
      movie.genre.some((g) => g.toLowerCase().includes(query.toLowerCase()));

    const matchesTag =
      selectedTag === 'Tất cả' ||
      movie.genre.some((g) => selectedTag.toLowerCase().includes(g.toLowerCase()));

    return matchesQuery && matchesTag;
  });

  const handleMoviePress = (movie: Movie) => {
    router.push({
      pathname: '/watch/[id]',
      params: { id: movie.id },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header onProfilePress={() => router.push('/profile')} />

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm phim, thể loại, công nghệ AI..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tags horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagRow}
        >
          {genreCategories.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                activeOpacity={0.8}
                onPress={() => setSelectedTag(tag)}
                style={[
                  styles.tagPill,
                  {
                    backgroundColor: isSelected
                      ? colors.ruby
                      : isDark
                      ? '#1E293B'
                      : '#F1F5F9',
                    borderColor: isSelected ? colors.ruby : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Grid of movies */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}
      >
        <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
          Hiển thị {filteredMovies.length} phim AI
        </Text>

        <View style={styles.grid}>
          {filteredMovies.map((movie) => (
            <View key={movie.id} style={{ width: CARD_WIDTH, marginBottom: 16 }}>
              <MovieCard
                movie={movie}
                cardWidth={CARD_WIDTH}
                onPress={() => handleMoviePress(movie)}
              />
            </View>
          ))}
        </View>

        {filteredMovies.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="film-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Không tìm thấy bộ phim phù hợp với từ khóa "{query}"
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
  },
  tagRow: {
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  resultsCount: {
    fontSize: 12,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
