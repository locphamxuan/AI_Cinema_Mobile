import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import type { Movie } from '../../types/movie';
import { styles } from '../../styles/components/explore/FilmRow.styles';

interface FilmRowProps {
  movie: Movie;
  onPress: () => void;
  /** Replaces the synopsis line, e.g. which episode came out. */
  detail?: React.ReactNode;
}

/** Poster on the left; title, genres and a short synopsis beside it. */
export const FilmRow: React.FC<FilmRowProps> = ({ movie, onPress, detail }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.row} accessibilityLabel={movie.title}>
      <View style={[styles.poster, { backgroundColor: colors.cardAlt }]}>
        {movie.posterUrl ? <Image source={{ uri: movie.posterUrl }} style={styles.image} resizeMode="cover" /> : null}
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {movie.title}
        </Text>
        {movie.genre.length > 0 ? (
          <Text style={[styles.genres, { color: colors.neon }]} numberOfLines={1}>
            {movie.genre.slice(0, 3).join(', ')}
          </Text>
        ) : null}
        {detail ??
          (movie.description ? (
            <Text style={[styles.synopsis, { color: colors.textMuted }]} numberOfLines={3}>
              {movie.description}
            </Text>
          ) : null)}
      </View>
    </TouchableOpacity>
  );
};
