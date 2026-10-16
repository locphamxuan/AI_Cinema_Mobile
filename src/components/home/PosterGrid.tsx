import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { textStyle, useTheme } from '../../theme';
import type { Movie } from '../../types/movie';

const COLUMNS = 3;
const GAP = 10;
const SIDE = 16;

interface PosterGridProps {
  movies: Movie[];
  onMoviePress: (movie: Movie) => void;
}

/** Three posters a row, each with its title and up to two genre tags (the first in orange). */
export const PosterGrid: React.FC<PosterGridProps> = ({ movies, onMoviePress }) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const inner = Math.min(width, 600) - SIDE * 2;
  const cardWidth = Math.floor((inner - GAP * (COLUMNS - 1)) / COLUMNS);

  return (
    <View style={styles.grid}>
      {movies.map((movie) => (
        <TouchableOpacity
          key={movie.id}
          activeOpacity={0.88}
          onPress={() => onMoviePress(movie)}
          style={{ width: cardWidth }}
          accessibilityLabel={movie.title}
        >
          <View style={[styles.poster, { height: Math.round(cardWidth * 1.36), backgroundColor: colors.cardAlt }]}>
            {movie.posterUrl ? <Image source={{ uri: movie.posterUrl }} style={styles.image} resizeMode="cover" /> : null}
            {movie.badge ? (
              <View style={[styles.badge, { backgroundColor: colors.hot }]}>
                <Text style={styles.badgeText}>{movie.badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {movie.title}
          </Text>
          {movie.genre.length > 0 ? (
            <View style={styles.tags}>
              {movie.genre.slice(0, 2).map((name, i) => (
                <View key={name} style={[styles.tag, { backgroundColor: colors.chip }]}>
                  <Text style={[styles.tagText, { color: i === 0 ? colors.neon : colors.textMuted }]} numberOfLines={1}>
                    {name}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
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
    rowGap: 20,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  poster: { borderRadius: 6, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomRightRadius: 6,
  },
  badgeText: { ...textStyle.captionStrong, color: '#FFFFFF' },
  title: { ...textStyle.labelStrong, fontSize: 14, marginTop: 8 },
  tags: { flexDirection: 'row', gap: 5, marginTop: 6, overflow: 'hidden' },
  tag: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, maxWidth: '100%', flexShrink: 1 },
  tagText: { ...textStyle.caption, lineHeight: 15 },
});
