import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Movie } from '../../types/movie';
import { MovieCard } from './MovieCard';
import { useTheme } from '../../theme';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onMoviePress: (movie: Movie) => void;
  onSeeAllPress?: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export const MovieRow: React.FC<MovieRowProps> = ({
  title,
  movies,
  onMoviePress,
  onSeeAllPress,
  iconName,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Header with accent indicator and See All */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View style={[styles.accentIndicator, { backgroundColor: colors.ruby }]} />
          {iconName && (
            <Ionicons
              name={iconName}
              size={17}
              color={colors.ruby}
              style={styles.titleIcon}
            />
          )}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        </View>

        {onSeeAllPress && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.seeAllBtn}
            onPress={onSeeAllPress}
          >
            <Text style={[styles.seeAllText, { color: colors.ruby }]}>Xem thêm</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.ruby} />
          </TouchableOpacity>
        )}
      </View>

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
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  accentIndicator: {
    width: 3.5,
    height: 18,
    borderRadius: 2,
  },
  titleIcon: {
    marginRight: 2,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingLeft: 8,
  },
  seeAllText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  scrollContent: {
    paddingLeft: 16,
    paddingRight: 4,
  },
});

