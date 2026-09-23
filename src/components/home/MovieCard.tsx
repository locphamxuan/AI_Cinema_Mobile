import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Movie } from '../../types/movie';
import { useTheme } from '../../theme';

export interface MovieCardProps {
  movie: Movie;
  onPress: () => void;
  cardWidth?: number;
  noMargin?: boolean;
  style?: StyleProp<ViewStyle>;
  showRating?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onPress,
  cardWidth = 130,
  noMargin = false,
  style,
  showRating = true,
}) => {
  const { colors, isDark } = useTheme();

  // Determine ribbon gradient colors based on ranking / badge
  const getBadgeGradient = (badgeText: string): [string, string] => {
    const lower = badgeText.toLowerCase();
    if (lower.includes('1')) return ['#EF4444', '#F97316'];
    if (lower.includes('2')) return ['#8B5CF6', '#EC4899'];
    if (lower.includes('3')) return ['#F59E0B', '#D97706'];
    return ['#DC2626', '#991B1B'];
  };

  const ratingValue = movie.matchScore
    ? (movie.matchScore / 20).toFixed(1)
    : '4.8';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.container,
        { width: cardWidth },
        noMargin ? { marginRight: 0 } : null,
        style,
      ]}
    >
      <View
        style={[
          styles.posterContainer,
          {
            height: Math.round(cardWidth * 1.48),
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <Image
          source={{ uri: movie.posterUrl }}
          style={styles.poster}
          resizeMode="cover"
        />

        {/* Top ribbon with gradient & shadow */}
        {movie.badge && (
          <LinearGradient
            colors={getBadgeGradient(movie.badge)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.badgeContainer}
          >
            <Text style={styles.badgeText}>{movie.badge.toUpperCase()}</Text>
          </LinearGradient>
        )}

        {/* Bottom overlay: Smooth Cinema Gradient Fade */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.45)', 'rgba(0, 0, 0, 0.92)']}
          locations={[0, 0.5, 1]}
          style={styles.overlayGradient}
        >
          <View style={styles.overlayBar}>
            {movie.matchScore ? (
              <View style={styles.matchScorePill}>
                <View style={styles.matchDot} />
                <Text style={styles.matchText}>{movie.matchScore}% Phù hợp</Text>
              </View>
            ) : <View />}

            {movie.quality && (
              <View style={styles.qualityPill}>
                <Text style={styles.qualityText}>
                  {movie.quality.includes('4K') ? '4K HDR' : 'HD'}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Movie Details */}
      <View style={styles.details}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {movie.title}
        </Text>

        {/* Metadata row: Rating, Year, Episodes */}
        <View style={styles.metaRow}>
          {showRating && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={[styles.ratingText, { color: isDark ? '#FCD34D' : '#D97706' }]}>
                {ratingValue}
              </Text>
            </View>
          )}
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {movie.year || 2026}
          </Text>
          {movie.totalEpisodes && (
            <>
              <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {movie.totalEpisodes} Tập
              </Text>
            </>
          )}
        </View>

        {/* Genre Tags */}
        <Text style={[styles.genre, { color: colors.textSecondary }]} numberOfLines={1}>
          {movie.genre.join(' • ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 12,
  },
  posterContainer: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  overlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  overlayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  matchScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  matchText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  qualityPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  qualityText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  details: {
    marginTop: 8,
    gap: 2,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingStar: {
    fontSize: 10,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaDot: {
    fontSize: 10,
  },
  genre: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
});
