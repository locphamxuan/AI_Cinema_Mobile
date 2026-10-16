import React from 'react';
import { View, Text, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTheme } from '../../theme';
import type { Movie } from '../../types/movie';
import { GRID_GAP as GAP, GRID_SIDE as SIDE } from '../../styles/layout';
import { styles } from '../../styles/components/home/PosterGrid.styles';

const COLUMNS = 3;

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
