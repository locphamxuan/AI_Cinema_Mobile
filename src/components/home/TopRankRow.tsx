import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Movie } from '../../types/movie';
import { useTheme } from '../../theme';

interface TopRankRowProps {
  movies: Movie[];
  onMoviePress: (movie: Movie) => void;
}

export const TopRankRow: React.FC<TopRankRowProps> = ({ movies, onMoviePress }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        🏆 Top 5 Phim AI Được Xem Nhiều Nhất Hôm Nay
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {movies.slice(0, 5).map((movie, index) => {
          const rank = index + 1;
          return (
            <TouchableOpacity
              key={movie.id}
              activeOpacity={0.85}
              onPress={() => onMoviePress(movie)}
              style={styles.item}
            >
              {/* Rank number container with fixed width for consistent alignment */}
              <View style={styles.rankContainer}>
                <Text
                  style={[
                    styles.rankNumber,
                    {
                      color: isDark ? '#475569' : '#94A3B8',
                      textShadowColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)',
                      textShadowOffset: { width: 1, height: 2 },
                      textShadowRadius: 3,
                    },
                  ]}
                >
                  {rank}
                </Text>
              </View>

              {/* Poster */}
              <View style={[styles.posterWrapper, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                <Image
                  source={{ uri: movie.posterUrl }}
                  style={styles.poster}
                  resizeMode="cover"
                />
                <View style={styles.topBadge}>
                  <Text style={styles.topBadgeText}>TOP {rank}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 16,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingLeft: 12,
    paddingRight: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: 160,
    marginRight: 12,
  },
  rankContainer: {
    width: 48,
    height: 170,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginRight: -16,
    zIndex: 1,
  },
  rankNumber: {
    fontSize: 84,
    fontWeight: '900',
    lineHeight: 90,
    textAlign: 'center',
  },
  posterWrapper: {
    width: 118,
    height: 170,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  topBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: '#E50914',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  topBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
