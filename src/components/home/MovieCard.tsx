import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Movie } from '../../types/movie';
import { useTheme } from '../../theme';

interface MovieCardProps {
  movie: Movie;
  onPress: () => void;
  cardWidth?: number;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onPress,
  cardWidth = 130,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.container, { width: cardWidth }]}
    >
      <View style={[styles.posterContainer, { height: cardWidth * 1.5 }]}>
        <Image
          source={{ uri: movie.posterUrl }}
          style={styles.poster}
          resizeMode="cover"
        />

        {/* Top badge if exists */}
        {movie.badge && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{movie.badge}</Text>
          </View>
        )}

        {/* Bottom overlay: Match % & Quality */}
        <View style={styles.overlayBar}>
          {movie.matchScore && (
            <Text style={styles.matchText}>{movie.matchScore}% Phù hợp</Text>
          )}
          {movie.quality && (
            <View style={styles.qualityPill}>
              <Text style={styles.qualityText}>{movie.quality.includes('4K') ? '4K' : 'HD'}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Movie Details */}
      <View style={styles.details}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {movie.title}
        </Text>
        <Text style={[styles.genre, { color: colors.textMuted }]} numberOfLines={1}>
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
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#E50914',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  overlayBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  matchText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  qualityPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  qualityText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  details: {
    marginTop: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  genre: {
    fontSize: 11,
    marginTop: 2,
  },
});
