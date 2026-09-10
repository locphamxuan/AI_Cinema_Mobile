import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Movie } from '../../types/movie';
import { useTheme } from '../../theme';

interface HeroBannerProps {
  movie: Movie;
  onPlayPress: () => void;
  onDetailPress: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  onPlayPress,
  onDetailPress,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: movie.bannerUrl }}
        style={styles.bannerImage}
        imageStyle={styles.imageRadius}
      >
        {/* Gradient-like dark overlay at bottom for readability */}
        <View style={styles.overlay}>
          {/* Top compliance badge */}
          <View style={styles.complianceBadge}>
            <MaterialCommunityIcons name="shield-check" size={14} color="#10B981" />
            <Text style={styles.complianceText}>Đạt chuẩn Điều 44 Luật AI • Điểm: 98.5%</Text>
          </View>

          {/* Title & Metadata */}
          <View style={styles.infoContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {movie.title}
            </Text>

            {/* Badges row */}
            <View style={styles.badgeRow}>
              {movie.matchScore && (
                <View style={[styles.badge, styles.matchBadge]}>
                  <Text style={styles.matchText}>{movie.matchScore}% Phù hợp</Text>
                </View>
              )}
              {movie.ageRating && (
                <View style={[styles.badge, styles.darkBadge]}>
                  <Text style={styles.badgeText}>{movie.ageRating}</Text>
                </View>
              )}
              {movie.quality && (
                <View style={[styles.badge, styles.darkBadge]}>
                  <Text style={styles.badgeText}>{movie.quality}</Text>
                </View>
              )}
              {movie.audioQuality && (
                <View style={[styles.badge, styles.darkBadge]}>
                  <Text style={styles.badgeText}>{movie.audioQuality}</Text>
                </View>
              )}
            </View>

            {/* Description */}
            <Text style={styles.description} numberOfLines={2}>
              {movie.description}
            </Text>

            {/* CTA Action Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.playBtn, { backgroundColor: colors.ruby }]}
                onPress={onPlayPress}
              >
                <Ionicons name="play" size={18} color="#FFFFFF" />
                <Text style={styles.playBtnText}>Xem Ngay</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.infoBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.4)',
                  },
                ]}
                onPress={onDetailPress}
              >
                <Ionicons name="information-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.infoBtnText}>Phiên bản AI</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: 240,
    justifyContent: 'space-between',
  },
  imageRadius: {
    borderRadius: 16,
  },
  overlay: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
    padding: 14,
  },
  complianceBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  complianceText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  infoContainer: {
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matchBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.85)',
  },
  matchText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  darkBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  infoBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
