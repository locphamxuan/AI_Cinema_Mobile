import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from '../../theme';
import type { Movie } from '../../types/movie';

const COLUMNS = 3;
const GAP = 10;
const SIDE = 16;

interface PosterGridProps {
  movies: Movie[];
  onMoviePress: (movie: Movie) => void;
  /** Show 1, 2, 3… on the poster (ranking order). */
  showRank?: boolean;
}

/** Three-column poster grid: poster, title and up to two genre tags per film. */
export const PosterGrid: React.FC<PosterGridProps> = ({ movies, onMoviePress, showRank = false }) => {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const inner = Math.min(width, 600) - SIDE * 2;
  const cardWidth = Math.floor((inner - GAP * (COLUMNS - 1)) / COLUMNS);

  return (
    <View style={styles.grid}>
      {movies.map((movie, index) => (
        <TouchableOpacity
          key={movie.id}
          activeOpacity={0.88}
          onPress={() => onMoviePress(movie)}
          style={{ width: cardWidth }}
        >
          <View style={[styles.poster, { height: Math.round(cardWidth * 1.45), backgroundColor: colors.cardAlt }]}>
            {movie.posterUrl ? (
              <Image source={{ uri: movie.posterUrl }} style={styles.image} resizeMode="cover" />
            ) : null}
            {movie.badge ? (
              <View style={[styles.badge, { backgroundColor: colors.ruby }]}>
                <Text style={styles.badgeText}>{movie.badge}</Text>
              </View>
            ) : null}
            {showRank ? (
              <View style={[styles.rank, { backgroundColor: index < 3 ? colors.ruby : 'rgba(0,0,0,0.65)' }]}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {movie.title}
          </Text>
          <View style={styles.tags}>
            {movie.genre.slice(0, 2).map((name) => (
              <View
                key={name}
                style={[styles.tag, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}
              >
                <Text style={[styles.tagText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {name}
                </Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIDE,
    columnGap: GAP,
    rowGap: 16,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  poster: { borderRadius: 10, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderBottomRightRadius: 8,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
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
  title: { marginTop: 6, fontSize: 13, fontWeight: '700' },
  tags: { flexDirection: 'row', gap: 4, marginTop: 4, overflow: 'hidden' },
  tag: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, maxWidth: '100%', flexShrink: 1 },
  tagText: { fontSize: 10.5, fontWeight: '600' },
});
