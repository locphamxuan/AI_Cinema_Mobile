import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Movie } from '../../types/movie';
import { MovieCard } from './MovieCard';
import { useTheme } from '../../theme';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onMoviePress: (movie: Movie) => void;
}

export const MovieRow: React.FC<MovieRowProps> = ({
  title,
  movies,
  onMoviePress,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onPress={() => onMoviePress(movie)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    paddingHorizontal: 16,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingLeft: 16,
    paddingRight: 4,
  },
});
