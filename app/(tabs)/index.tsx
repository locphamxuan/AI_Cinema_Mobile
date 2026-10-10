import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { HeroBanner } from '../../src/components/home/HeroBanner';
import { ContinueWatchingSection } from '../../src/components/home/ContinueWatchingSection';
import { CategoryPills } from '../../src/components/home/CategoryPills';
import { TopRankRow } from '../../src/components/home/TopRankRow';
import { MovieRow } from '../../src/components/home/MovieRow';
import { AIComplianceModal } from '../../src/components/player/AIComplianceModal';
import { useTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/useAppStore';
import { Movie } from '../../src/types/movie';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { movies, currentMovie, loadInitialData, fetchMovies } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [refreshing, setRefreshing] = useState(false);
  const [complianceModalVisible, setComplianceModalVisible] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const movieList = movies;

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleMoviePress = (movie: Movie) => {
    router.push({
      pathname: '/movie/[id]',
      params: { id: movie.id },
    });
  };

  const handleSeeAll = (category?: string) => {
    router.push('/(tabs)/explore');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <Header onProfilePress={() => router.push('/profile')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.ruby}
          />
        }
      >
        {/* Featured Hero Banner Carousel */}
        <HeroBanner
          movies={movieList.slice(0, 5)}
          onPlayPress={handleMoviePress}
          onDetailPress={handleMoviePress}
        />

        {/* Continue Watching Section (Đang Xem Dở) */}
        <ContinueWatchingSection />

        {/* Categories Bar */}
        <CategoryPills
          selectedCategory={selectedCategory}
          onSelectCategory={(category) => {
            setSelectedCategory(category);
            void fetchMovies({ genre: category === 'Tất cả' ? undefined : category });
          }}
        />

        {/* Top 5 Ranked Row */}
        <TopRankRow movies={movieList} onMoviePress={handleMoviePress} />

        {/* Trending Movies Row */}
        <MovieRow
          title="Danh sách phim"
          iconName="flame"
          movies={movieList}
          onMoviePress={handleMoviePress}
          onSeeAllPress={() => handleSeeAll('Phim Mới')}
        />

        {/* Cyberpunk Collection Row */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* AI Compliance Modal */}
      {currentMovie && (
        <AIComplianceModal
          visible={complianceModalVisible}
          onClose={() => setComplianceModalVisible(false)}
          compliance={currentMovie.aiCompliance}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  guestBannerWrapper: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 14,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  guestBanner: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  guestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  guestIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  guestTextContainer: {
    flex: 1,
    gap: 3,
  },
  guestBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  guestTag: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  guestTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  guestTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  guestSubtitle: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  guestBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  bottomSpacer: {
    height: 36,
  },
});
