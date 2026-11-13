import React from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import type { Movie } from '../../types/movie';
import { styles } from '../../styles/components/movie/RecommendationRail.styles';

interface RecommendationRailProps {
  title: string;
  caption?: string;
  movies: Movie[];
  onMoviePress: (movie: Movie) => void;
}

/** A row of AI-recommended movies (BR-68), each with the reason the AI picked it. Renders nothing when empty. */
export const RecommendationRail: React.FC<RecommendationRailProps> = ({ title, caption, movies, onMoviePress }) => {
  const { colors } = useTheme();
  if (movies.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.heading, { color: colors.text }]}>{title}</Text>
      {caption ? <Text style={[styles.caption, { color: colors.textSecondary }]}>{caption}</Text> : null}
      <FlatList
        horizontal
        data={movies}
        keyExtractor={(movie) => movie.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onMoviePress(item)}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            <Image source={{ uri: item.posterUrl }} style={[styles.poster, { backgroundColor: colors.surface }]} />
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            {item.recommendReason ? (
              <Text style={[styles.reason, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.recommendReason}
              </Text>
            ) : null}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
