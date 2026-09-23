import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../../src/components/common/Header';
import { MovieCard } from '../../src/components/home/MovieCard';
import { useTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/useAppStore';
import { allMockMovies, genreCategories } from '../../src/mocks/mockData';
import { Movie } from '../../src/types/movie';

type SortOption = 'trending' | 'rating' | 'newest';
type ViewMode = 'grid' | 'list';

interface GenreItem {
  id: string;
  name: string;
  icon: string;
}

const GENRE_ITEMS: GenreItem[] = [
  { id: 'Tất cả', name: 'Tất cả', icon: 'sparkles' },
  { id: 'Thịnh hành', name: 'Thịnh hành', icon: 'flame' },
  { id: 'Khoa học Viễn tưởng', name: 'Viễn Tưởng', icon: 'planet-outline' },
  { id: 'Cyberpunk 2049', name: 'Cyberpunk', icon: 'hardware-chip-outline' },
  { id: 'Hành động Kịch tính', name: 'Hành Động', icon: 'flash-outline' },
  { id: 'Trí tuệ Nhân tạo', name: 'AI Gốc', icon: 'code-slash-outline' },
  { id: 'Tâm lý & Bí ẩn', name: 'Tâm Lý', icon: 'eye-outline' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { movies } = useAppStore();
  const { width: windowWidth } = useWindowDimensions();

  // Responsive layout calculations
  const containerWidth = Math.min(windowWidth, 600);
  const cardWidth = Math.max(145, Math.floor((containerWidth - 32 - 12) / 2));

  // States
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('Tất cả');
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Filter and sort movies
  const filteredMovies = useMemo<Movie[]>(() => {
    const sourceList: Movie[] = movies && movies.length > 0 ? movies : allMockMovies;
    let result: Movie[] = sourceList.filter((movie: Movie) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        movie.title.toLowerCase().includes(q) ||
        movie.genre.some((g: string) => g.toLowerCase().includes(q)) ||
        (movie.aiCompliance?.aiModel && movie.aiCompliance.aiModel.toLowerCase().includes(q));

      const matchesTag =
        selectedTag === 'Tất cả' ||
        movie.genre.some((g: string) => g.toLowerCase().includes(selectedTag.toLowerCase())) ||
        (selectedTag === 'Thịnh hành' && Boolean(movie.badge));

      return matchesQuery && matchesTag;
    });

    // Sorting
    result.sort((a: Movie, b: Movie) => {
      if (sortBy === 'rating') {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      if (sortBy === 'newest') {
        return (b.year || 2026) - (a.year || 2026);
      }
      // trending
      const rankA = a.badge ? 1 : 0;
      const rankB = b.badge ? 1 : 0;
      return rankB - rankA || (b.matchScore || 0) - (a.matchScore || 0);
    });

    return result;
  }, [query, selectedTag, sortBy]);

  const handleMoviePress = (movie: Movie) => {
    router.push({
      pathname: '/watch/[id]',
      params: { id: movie.id },
    });
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedTag('Tất cả');
    setSortBy('trending');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header onProfilePress={() => router.push('/profile')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Featured Cinema Spotlight Banner (Only when not actively searching) */}
        {!query && (
          <View style={styles.spotlightContainer}>
            <LinearGradient
              colors={isDark ? ['#2D0B12', '#141824'] : ['#FFF1F2', '#F8FAFC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.spotlightCard,
                {
                  borderColor: isDark ? 'rgba(229, 9, 20, 0.3)' : 'rgba(229, 9, 20, 0.15)',
                },
              ]}
            >
              <View style={styles.spotlightHeader}>
                <View style={styles.spotlightBadge}>
                  <Ionicons name="sparkles" size={11} color="#E50914" />
                  <Text style={styles.spotlightBadgeText}>VŨ TRỤ ĐIỆN ẢNH AI 2026</Text>
                </View>
                <View style={styles.complianceChip}>
                  <Ionicons name="shield-checkmark" size={11} color="#10B981" />
                  <Text style={styles.complianceChipText}>Chuẩn Luật AI</Text>
                </View>
              </View>

              <Text style={[styles.spotlightTitle, { color: colors.text }]}>
                Khám Phá Phim AI Thế Hệ Mới
              </Text>
              <Text style={[styles.spotlightDesc, { color: colors.textSecondary }]}>
                Kho tác phẩm điện ảnh 4K Ultra HD render 100% bằng CinemaGen v3.2 & Sora Vision Pro.
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Search Bar Section */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? '#181C28' : '#FFFFFF',
                borderColor: isSearchFocused ? colors.ruby : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                shadowColor: isSearchFocused ? colors.ruby : '#000000',
                shadowOpacity: isSearchFocused ? 0.25 : 0.06,
              },
            ]}
          >
            <Ionicons
              name="search"
              size={19}
              color={isSearchFocused ? colors.ruby : colors.textMuted}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Tìm phim, đạo diễn AI, Sora, Cyberpunk..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Horizontal Filter Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreRow}
          >
            {GENRE_ITEMS.map((item) => {
              const isSelected = selectedTag === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedTag(item.id)}
                  style={[
                    styles.genrePill,
                    isSelected
                      ? {
                          backgroundColor: colors.ruby,
                          borderColor: colors.ruby,
                          shadowColor: colors.ruby,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.35,
                          shadowRadius: 4,
                          elevation: 3,
                        }
                      : {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                        },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={13}
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.genreText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Toolbar: Result Count, Sorting & View Mode Switcher */}
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              Hiển thị <Text style={{ fontWeight: '800', color: colors.text }}>{filteredMovies.length}</Text> phim AI
            </Text>
          </View>

          <View style={styles.toolbarRight}>
            {/* Sort pills */}
            <View style={[styles.sortSegment, { backgroundColor: isDark ? '#1E2333' : '#F1F5F9' }]}>
              <TouchableOpacity
                onPress={() => setSortBy('trending')}
                style={[
                  styles.sortBtn,
                  sortBy === 'trending' && [styles.sortBtnActive, { backgroundColor: isDark ? '#2E354B' : '#FFFFFF' }],
                ]}
              >
                <Text
                  style={[
                    styles.sortBtnText,
                    {
                      color: sortBy === 'trending' ? colors.ruby : colors.textMuted,
                      fontWeight: sortBy === 'trending' ? '800' : '500',
                    },
                  ]}
                >
                  🔥 Hot
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSortBy('rating')}
                style={[
                  styles.sortBtn,
                  sortBy === 'rating' && [styles.sortBtnActive, { backgroundColor: isDark ? '#2E354B' : '#FFFFFF' }],
                ]}
              >
                <Text
                  style={[
                    styles.sortBtnText,
                    {
                      color: sortBy === 'rating' ? colors.ruby : colors.textMuted,
                      fontWeight: sortBy === 'rating' ? '800' : '500',
                    },
                  ]}
                >
                  ⭐ Điểm
                </Text>
              </TouchableOpacity>
            </View>

            {/* View Mode Toggle (Grid vs List) */}
            <View style={[styles.viewModeToggle, { backgroundColor: isDark ? '#1E2333' : '#F1F5F9' }]}>
              <TouchableOpacity
                onPress={() => setViewMode('grid')}
                style={[
                  styles.viewModeBtn,
                  viewMode === 'grid' && [styles.viewModeBtnActive, { backgroundColor: isDark ? '#2E354B' : '#FFFFFF' }],
                ]}
              >
                <Ionicons
                  name="grid-outline"
                  size={15}
                  color={viewMode === 'grid' ? colors.ruby : colors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode('list')}
                style={[
                  styles.viewModeBtn,
                  viewMode === 'list' && [styles.viewModeBtnActive, { backgroundColor: isDark ? '#2E354B' : '#FFFFFF' }],
                ]}
              >
                <Ionicons
                  name="list-outline"
                  size={16}
                  color={viewMode === 'list' ? colors.ruby : colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Movies Display Section */}
        {viewMode === 'grid' ? (
          /* 2-Column Responsive Cinema Grid */
          <View style={styles.grid}>
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                cardWidth={cardWidth}
                noMargin
                style={{ marginBottom: 18 }}
                onPress={() => handleMoviePress(movie)}
              />
            ))}
          </View>
        ) : (
          /* Rich Cinema List View with Synopsis & AI Details */
          <View style={styles.listView}>
            {filteredMovies.map((movie) => {
              const ratingValue = movie.matchScore ? (movie.matchScore / 20).toFixed(1) : '4.8';
              return (
                <TouchableOpacity
                  key={movie.id}
                  activeOpacity={0.88}
                  onPress={() => handleMoviePress(movie)}
                  style={[
                    styles.listCard,
                    {
                      backgroundColor: isDark ? '#151924' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                >
                  <View style={styles.listPosterWrap}>
                    <Image
                      source={{ uri: movie.posterUrl }}
                      style={styles.listPoster}
                      resizeMode="cover"
                    />
                    <View style={styles.listPlayBubble}>
                      <Ionicons name="play" size={14} color="#FFFFFF" />
                    </View>
                    {movie.badge && (
                      <View style={styles.listBadgeMini}>
                        <Text style={styles.listBadgeText}>HOT</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.listInfo}>
                    <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>
                      {movie.title}
                    </Text>

                    <View style={styles.listMetaRow}>
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingStar}>⭐</Text>
                        <Text style={[styles.ratingText, { color: isDark ? '#FCD34D' : '#D97706' }]}>
                          {ratingValue}
                        </Text>
                      </View>
                      <Text style={[styles.listMetaText, { color: colors.textMuted }]}>
                        {movie.year || 2026}
                      </Text>
                      <Text style={[styles.listMetaDot, { color: colors.textMuted }]}>•</Text>
                      <Text style={[styles.listMetaText, { color: colors.textMuted }]}>
                        {movie.totalEpisodes ? `${movie.totalEpisodes} Tập` : 'Phim lẻ'}
                      </Text>
                      {movie.quality && (
                        <View style={styles.listQualityPill}>
                          <Text style={styles.listQualityText}>
                            {movie.quality.includes('4K') ? '4K' : 'HD'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.listSynopsis, { color: colors.textSecondary }]} numberOfLines={2}>
                      {movie.description}
                    </Text>

                    <View style={styles.listFooter}>
                      <View style={styles.aiTagPill}>
                        <Ionicons name="hardware-chip-outline" size={11} color="#8B5CF6" />
                        <Text style={styles.aiTagText} numberOfLines={1}>
                          {movie.aiCompliance?.aiModel ? movie.aiCompliance.aiModel.split('+')[0].trim() : 'GenAI v3.2'}
                        </Text>
                      </View>

                      <View style={[styles.watchBtnMini, { backgroundColor: colors.ruby }]}>
                        <Text style={styles.watchBtnMiniText}>Xem ngay</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {filteredMovies.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2' }]}>
              <Ionicons name="film-outline" size={40} color={colors.ruby} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Không tìm thấy tác phẩm phù hợp
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Không có bộ phim AI nào khớp với từ khóa "{query}" hoặc bộ lọc "{selectedTag}".
            </Text>
            <TouchableOpacity
              style={[styles.resetFilterBtn, { backgroundColor: colors.ruby }]}
              onPress={handleResetFilters}
            >
              <Ionicons name="refresh" size={15} color="#FFFFFF" />
              <Text style={styles.resetFilterBtnText}>Đặt lại bộ lọc</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 36,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },

  // Spotlight Banner
  spotlightContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  spotlightCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  spotlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  spotlightBadgeText: {
    color: '#E50914',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  complianceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  complianceChipText: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '700',
  },
  spotlightTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  spotlightDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },

  // Search & Genres
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    fontWeight: '500',
  },
  genreRow: {
    gap: 8,
    paddingVertical: 2,
  },
  genrePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  genreText: {
    fontSize: 11.5,
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toolbarLeft: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 12,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortSegment: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
  },
  sortBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sortBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  sortBtnText: {
    fontSize: 11,
  },
  viewModeToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
  },
  viewModeBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewModeBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },

  // Grid View
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 6,
  },

  // List View
  listView: {
    paddingHorizontal: 16,
    gap: 12,
    paddingTop: 4,
  },
  listCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  listPosterWrap: {
    width: 90,
    height: 125,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  listPoster: {
    width: '100%',
    height: '100%',
  },
  listPlayBubble: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(229, 9, 20, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  listBadgeMini: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  listBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  listInfo: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginVertical: 2,
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
  listMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listMetaDot: {
    fontSize: 9,
  },
  listQualityPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  listQualityText: {
    color: '#3B82F6',
    fontSize: 8.5,
    fontWeight: '800',
  },
  listSynopsis: {
    fontSize: 11,
    lineHeight: 15,
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  aiTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '65%',
  },
  aiTagText: {
    color: '#8B5CF6',
    fontSize: 9.5,
    fontWeight: '700',
  },
  watchBtnMini: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  watchBtnMiniText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: 8,
  },
  resetFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

