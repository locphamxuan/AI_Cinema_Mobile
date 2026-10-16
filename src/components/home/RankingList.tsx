import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import type { Movie } from '../../types/movie';

interface RankingListProps {
  movies: Movie[];
  onMoviePress: (movie: Movie) => void;
}

/** One film per row: poster with its position, title, genres and the start of the synopsis. */
export const RankingList: React.FC<RankingListProps> = ({ movies, onMoviePress }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.list}>
      {movies.map((movie, index) => (
        <TouchableOpacity
          key={movie.id}
          activeOpacity={0.88}
          onPress={() => onMoviePress(movie)}
          style={styles.row}
        >
          <View style={[styles.poster, { backgroundColor: colors.cardAlt }]}>
            {movie.posterUrl ? (
              <Image source={{ uri: movie.posterUrl }} style={styles.image} resizeMode="cover" />
            ) : null}
            <View style={[styles.rank, { backgroundColor: index < 3 ? colors.ruby : 'rgba(0,0,0,0.65)' }]}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
          </View>
          <View style={styles.info}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {movie.title}
            </Text>
            <View style={styles.tags}>
              {movie.genre.slice(0, 3).map((name) => (
                <View
                  key={name}
                  style={[styles.tag, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}
                >
                  <Text style={[styles.tagText, { color: colors.ruby }]}>{name}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.synopsis, { color: colors.textSecondary }]} numberOfLines={3}>
              {movie.description}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, gap: 16, maxWidth: 600, alignSelf: 'center', width: '100%' },
  row: { flexDirection: 'row', gap: 12 },
  poster: { width: 100, height: 140, borderRadius: 10, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  rank: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  info: { flex: 1, gap: 6 },
  title: { fontSize: 15, fontWeight: '800' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  tagText: { fontSize: 11, fontWeight: '700' },
  synopsis: { fontSize: 12, lineHeight: 17 },
});
