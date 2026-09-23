import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Movie } from '../../types/movie';
import { useTheme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

interface HeroBannerProps {
  movie?: Movie;
  movies?: Movie[];
  onPlayPress?: (movie: Movie) => void;
  onDetailPress?: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  movies,
  onPlayPress,
  onDetailPress,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const BANNER_WIDTH = Math.min(windowWidth, 600) - 32;

  const { colors, isDark } = useTheme();
  const { myList, toggleMyList } = useAppStore();

  const movieList = movies && movies.length > 0 ? movies : movie ? [movie] : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll every 5.5 seconds if multiple movies
  useEffect(() => {
    if (movieList.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % movieList.length;
        scrollRef.current?.scrollTo({ x: next * BANNER_WIDTH, animated: true });
        return next;
      });
    }, 5500);

    return () => clearInterval(interval);
  }, [movieList.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / BANNER_WIDTH);
    if (index !== currentIndex && index >= 0 && index < movieList.length) {
      setCurrentIndex(index);
    }
  };

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
    scrollRef.current?.scrollTo({ x: idx * BANNER_WIDTH, animated: true });
  };

  if (movieList.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH}
        contentContainerStyle={styles.scrollContainer}
      >
        {movieList.map((item, idx) => {
          const isAdded = myList.includes(item.id);

          return (
            <View key={item.id} style={[styles.slideItem, { width: BANNER_WIDTH }]}>
              <ImageBackground
                source={{ uri: item.bannerUrl }}
                style={styles.bannerImage}
                imageStyle={styles.imageRadius}
              >
                {/* Dark Cinema Vignette Overlay with LinearGradient */}
                <LinearGradient
                  colors={['rgba(0, 0, 0, 0.15)', 'rgba(10, 13, 22, 0.42)', 'rgba(8, 10, 18, 0.95)']}
                  locations={[0, 0.45, 1]}
                  style={styles.overlay}
                >
                  {/* Top Row: TOP 10 Flame Ribbon + Compliance Badge */}
                  <View style={styles.topRow}>
                    <LinearGradient
                      colors={['#EF4444', '#F59E0B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.top10Badge}
                    >
                      <Ionicons name="flame" size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                      <Text style={styles.top10Text}>TOP 10 PHIM AI</Text>
                    </LinearGradient>

                    <View style={styles.complianceBadge}>
                      <MaterialCommunityIcons name="shield-check" size={12} color="#10B981" />
                      <Text style={styles.complianceText}>Đạt chuẩn Đ.44 Luật AI</Text>
                    </View>
                  </View>

                  {/* Title & Metadata */}
                  <View style={styles.infoContainer}>
                    <Text style={styles.title} numberOfLines={2}>
                      {item.title}
                    </Text>

                    {/* Metadata chips row */}
                    <View style={styles.badgeRow}>
                      <Text style={styles.metaSubtitle}>
                        {item.year} | {idx % 2 === 0 ? 'Âu Mỹ' : 'Việt Nam AI'}
                      </Text>

                      {item.matchScore && (
                        <View style={[styles.badge, styles.matchBadge]}>
                          <Text style={styles.matchText}>{item.matchScore}% Phù hợp</Text>
                        </View>
                      )}

                      {item.ageRating && (
                        <View style={[styles.badge, styles.darkBadge]}>
                          <Text style={styles.badgeText}>{item.ageRating}</Text>
                        </View>
                      )}

                      {item.quality && (
                        <View style={[styles.badge, styles.darkBadge]}>
                          <Text style={styles.badgeText}>{item.quality}</Text>
                        </View>
                      )}
                    </View>

                    {/* Genre Pills */}
                    <View style={styles.genreRow}>
                      {item.genre.slice(0, 3).map((g) => (
                        <View key={g} style={styles.genrePill}>
                          <Text style={styles.genrePillText}>{g}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Description */}
                    <Text style={styles.description} numberOfLines={2}>
                      {item.description}
                    </Text>

                    {/* CTA Action Buttons */}
                    <View style={styles.btnRow}>
                      {/* Primary Ruby Red Xem Ngay Button with Gradient */}
                      <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => onPlayPress?.(item)}
                      >
                        <LinearGradient
                          colors={['#E50914', '#B91C1C']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.playBtn}
                        >
                          <Ionicons name="play" size={15} color="#FFFFFF" />
                          <Text style={styles.playBtnText}>Xem Ngay</Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* My List Bookmark Button */}
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={[
                          styles.actionIconBtn,
                          isAdded && styles.actionIconBtnActive,
                        ]}
                        onPress={() => toggleMyList(item.id)}
                      >
                        <Ionicons
                          name={isAdded ? 'checkmark' : 'add'}
                          size={17}
                          color="#FFFFFF"
                        />
                        <Text style={styles.actionBtnText}>
                          {isAdded ? 'Đã thêm' : 'Danh sách'}
                        </Text>
                      </TouchableOpacity>

                      {/* Sound Mute Toggle Button */}
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.soundBtn}
                        onPress={() => setIsMuted(!isMuted)}
                      >
                        <Feather
                          name={isMuted ? 'volume-x' : 'volume-2'}
                          size={16}
                          color="#FFFFFF"
                        />
                      </TouchableOpacity>

                      {/* Details Button */}
                      {onDetailPress && (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          style={styles.soundBtn}
                          onPress={() => onDetailPress(item)}
                        >
                          <Ionicons name="information-circle-outline" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </View>
          );
        })}
      </ScrollView>

      {/* Pagination Dots at Bottom Right */}
      {movieList.length > 1 && (
        <View style={styles.paginationContainer}>
          {movieList.map((m, idx) => {
            const isActive = idx === currentIndex;
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => goToSlide(idx)}
                style={[
                  styles.paginationDot,
                  isActive ? styles.paginationDotActive : styles.paginationDotInactive,
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    position: 'relative',
  },
  scrollContainer: {
    alignItems: 'center',
  },
  slideItem: {
    marginRight: 0,
  },
  bannerImage: {
    width: '100%',
    height: 310,
    justifyContent: 'space-between',
  },
  imageRadius: {
    borderRadius: 20,
  },
  overlay: {
    flex: 1,
    borderRadius: 20,
    justifyContent: 'space-between',
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  top10Badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  top10Text: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  complianceText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
  },
  infoContainer: {
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: -0.3,
  },
  metaSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 2,
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
    borderRadius: 5,
  },
  matchBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.55)',
  },
  matchText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
  },
  darkBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 1,
  },
  genrePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  genrePillText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    fontWeight: '600',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    lineHeight: 15.5,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8.5,
    borderRadius: 24,
    gap: 5,
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 4,
  },
  actionIconBtnActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.25)',
    borderColor: '#E50914',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  soundBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 24,
    right: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  paginationDot: {
    height: 5,
    borderRadius: 3,
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: '#E50914',
  },
  paginationDotInactive: {
    width: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});
