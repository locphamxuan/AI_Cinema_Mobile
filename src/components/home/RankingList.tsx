import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import type { Movie } from '../../types/movie';
import { styles } from '../../styles/components/home/RankingList.styles';

interface RankingListProps {
  movies: Movie[];
  onMoviePress: (movie: Movie) => void;
}

/** One film a row, led by its place in large condensed numerals; the top three in pink. */
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
          accessibilityLabel={`Hạng ${index + 1}, ${movie.title}`}
        >
          <Text style={[styles.rank, { color: index < 3 ? colors.ruby : colors.textMuted }]}>{index + 1}</Text>
          <View style={[styles.poster, { backgroundColor: colors.cardAlt }]}>
            {movie.posterUrl ? <Image source={{ uri: movie.posterUrl }} style={styles.image} resizeMode="cover" /> : null}
          </View>
          <View style={styles.info}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {movie.title}
            </Text>
            {movie.genre[0] ? (
              <View style={[styles.tag, { backgroundColor: colors.chip }]}>
                <Text style={[styles.tagText, { color: colors.neon }]}>{movie.genre[0]}</Text>
              </View>
            ) : null}
            {movie.description ? (
              <Text style={[styles.synopsis, { color: colors.textMuted }]} numberOfLines={2}>
                {movie.description}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};
