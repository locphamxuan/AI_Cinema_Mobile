import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Movie } from '../../types/movie';
import { useTheme } from '../../theme';

interface TopRankRowProps {
  movies: Movie[];
  onMoviePress: (movie: Movie) => void;
}

export const TopRankRow: React.FC<TopRankRowProps> = ({ movies, onMoviePress }) => {
  const { colors, isDark } = useTheme();

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#EF4444';
      case 2:
        return '#F59E0B';
      case 3:
        return '#8B5CF6';
      default:
        return isDark ? '#475569' : '#94A3B8';
    }
  };

  const getRankBadgeGradient = (rank: number): [string, string] => {
    switch (rank) {
      case 1:
        return ['#EF4444', '#F97316'];
      case 2:
        return ['#8B5CF6', '#EC4899'];
      case 3:
        return ['#F59E0B', '#D97706'];
      default:
        return ['#475569', '#334155'];
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.titleIcon}>🔥</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Top 5 Thịnh Hành Nhất Hôm Nay
          </Text>
        </View>
        <Text style={[styles.subBadge, { color: colors.ruby }]}>HOT DAILY</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {movies.slice(0, 5).map((movie, index) => {
          const rank = index + 1;
          const rankColor = getRankColor(rank);

          return (
            <TouchableOpacity
              key={movie.id}
              activeOpacity={0.88}
              onPress={() => onMoviePress(movie)}
              style={styles.item}
            >
              {/* Large Stylized Rank Number */}
              <View style={styles.rankContainer}>
                <Text
                  style={[
                    styles.rankNumber,
                    {
                      color: rankColor,
                      textShadowColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.15)',
                      textShadowOffset: { width: 1, height: 2 },
                      textShadowRadius: 4,
                    },
                  ]}
                >
                  {rank}
                </Text>
              </View>

              {/* Poster Card */}
              <View
                style={[
                  styles.posterWrapper,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <Image
                  source={{ uri: movie.posterUrl }}
                  style={styles.poster}
                  resizeMode="cover"
                />

                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
                  locations={[0, 0.5, 1]}
                  style={styles.posterGradient}
                >
                  <LinearGradient
                    colors={getRankBadgeGradient(rank)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.topBadge}
                  >
                    <Text style={styles.topBadgeText}>TOP {rank}</Text>
                  </LinearGradient>
                </LinearGradient>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subBadge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  scrollContent: {
    paddingLeft: 12,
    paddingRight: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: 165,
    marginRight: 12,
  },
  rankContainer: {
    width: 48,
    height: 175,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginRight: -16,
    zIndex: 1,
  },
  rankNumber: {
    fontSize: 88,
    fontWeight: '900',
    lineHeight: 94,
    textAlign: 'center',
  },
  posterWrapper: {
    width: 120,
    height: 175,
    borderRadius: 14,
    overflow: 'hidden',
    zIndex: 2,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: 'flex-end',
    padding: 6,
  },
  topBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  topBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});

