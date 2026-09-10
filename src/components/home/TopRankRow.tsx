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
              {/* Rank number */}
              <Text
                style={[
                  styles.rankNumber,
                  {
                    color: isDark ? '#334155' : '#CBD5E1',
                    textShadowColor: isDark ? '#000000' : 'rgba(0,0,0,0.15)',
                  },
                ]}
              >
                {rank}
              </Text>

              {/* Poster */}
              <View style={styles.posterWrapper}>
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
    fontSize: 17,
    fontWeight: '800',
    paddingHorizontal: 16,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingLeft: 8,
    paddingRight: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: 170,
    marginRight: 6,
    position: 'relative',
  },
  rankNumber: {
    fontSize: 90,
    fontWeight: '900',
    lineHeight: 95,
    position: 'absolute',
    left: 2,
    bottom: -10,
    zIndex: 1,
    letterSpacing: -5,
  },
  posterWrapper: {
    width: 120,
    height: 170,
    borderRadius: 8,
    overflow: 'hidden',
    marginLeft: 44,
    zIndex: 2,
    backgroundColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
