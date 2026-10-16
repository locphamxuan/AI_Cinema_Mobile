import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import type { Movie } from '../../types/movie';

interface RankingListProps {
  movies: Movie[];
  onMoviePress: (movie: Movie) => void;
}

// Ribbon colors for the top three, the rest share a grey one.
const RIBBON = ['#FFB020', '#19C37D', '#3D8BFF'];

/** One film per row: poster with its position, title, orange genre chip and the start of the synopsis. */
export const RankingList: React.FC<RankingListProps> = ({ movies, onMoviePress }) => {
  const { colors } = useTheme();

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
            {movie.badge ? (
              <View style={[styles.badge, { backgroundColor: colors.hot }]}>
                <Text style={styles.badgeText}>{movie.badge}</Text>
              </View>
            ) : null}
            <View style={[styles.rank, { backgroundColor: RIBBON[index] ?? 'rgba(0,0,0,0.7)' }]}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
          </View>
          <View style={styles.info}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {movie.title}
            </Text>
            {movie.genre[0] ? (
              <View style={[styles.tag, { backgroundColor: colors.chip }]}>
                <Text style={[styles.tagText, { color: colors.neon }]}>{movie.genre[0]}</Text>
              </View>
            ) : null}
            <Text style={[styles.synopsis, { color: colors.textMuted }]} numberOfLines={2}>
              {movie.description}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, gap: 18, maxWidth: 600, alignSelf: 'center', width: '100%' },
  row: { flexDirection: 'row', gap: 14 },
  poster: { width: 96, height: 128, borderRadius: 8, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderBottomRightRadius: 8,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  rank: {
    position: 'absolute',
    left: 0,
    bottom: 28,
    minWidth: 22,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    alignItems: 'center',
  },
  rankText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  info: { flex: 1, gap: 10, paddingTop: 2 },
  title: { fontSize: 16, fontWeight: '600' },
  tag: { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { fontSize: 12.5, fontWeight: '600' },
  synopsis: { fontSize: 13.5, lineHeight: 19 },
});
