import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../../src/components/common/Header';
import { HeroBanner } from '../../src/components/home/HeroBanner';
import { ContinueWatchingSection } from '../../src/components/home/ContinueWatchingSection';
import { CategoryPills } from '../../src/components/home/CategoryPills';
import { TopRankRow } from '../../src/components/home/TopRankRow';
import { MovieRow } from '../../src/components/home/MovieRow';
import { VersionSelectorModal } from '../../src/components/player/VersionSelectorModal';
import { AIComplianceModal } from '../../src/components/player/AIComplianceModal';
import { useTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/useAppStore';
import { allMockMovies, mockMovie, top10Movies } from '../../src/mocks/mockData';
import { Movie } from '../../src/types/movie';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isAuthenticated, openAuthModal } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [refreshing, setRefreshing] = useState(false);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [complianceModalVisible, setComplianceModalVisible] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleMoviePress = (movie: Movie) => {
    router.push({
      pathname: '/watch/[id]',
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
        {/* Luxury Guest Announcement Banner if unauthenticated */}
        {!isAuthenticated && (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => openAuthModal('login')}
            style={styles.guestBannerWrapper}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['#2A1020', '#181226', '#0F172A']
                  : ['#FFF1F2', '#FFE4E6', '#F8FAFC']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.guestBanner,
                {
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.25)',
                },
              ]}
            >
              <View style={styles.guestLeft}>
                <LinearGradient
                  colors={['#EF4444', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.guestIconGradient}
                >
                  <Ionicons name="gift" size={18} color="#FFFFFF" />
                </LinearGradient>

                <View style={styles.guestTextContainer}>
                  <View style={styles.guestBadgeRow}>
                    <View style={styles.guestTag}>
                      <Text style={styles.guestTagText}>QUÀ TÂN THỦ</Text>
                    </View>
                    <Text style={[styles.guestTitle, { color: colors.text }]}>
                      Tặng 50 Coin Trải Nghiệm
                    </Text>
                  </View>
                  <Text
                    style={[styles.guestSubtitle, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    Xem trọn vẹn phim AI 4K & Trải nghiệm Studio AI
                  </Text>
                </View>
              </View>

              <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.guestBtn}
              >
                <Text style={styles.guestBtnText}>Nhận ngay</Text>
                <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
              </LinearGradient>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Featured Hero Banner Carousel */}
        <HeroBanner
          movies={top10Movies}
          onPlayPress={handleMoviePress}
          onDetailPress={() => setVersionModalVisible(true)}
        />

        {/* Continue Watching Section (Đang Xem Dở) */}
        <ContinueWatchingSection />

        {/* Categories Bar */}
        <CategoryPills
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Top 5 Ranked Row */}
        <TopRankRow movies={allMockMovies} onMoviePress={handleMoviePress} />

        {/* Trending Movies Row */}
        <MovieRow
          title="Phim Mới Phát Hành & Thịnh Hành"
          iconName="flame"
          movies={allMockMovies}
          onMoviePress={handleMoviePress}
          onSeeAllPress={() => handleSeeAll('Phim Mới')}
        />

        {/* Cyberpunk Collection Row */}
        <MovieRow
          title="Tuyển Tập Cyberpunk 2049"
          iconName="hardware-chip-outline"
          movies={[allMockMovies[1], allMockMovies[4], allMockMovies[0], allMockMovies[3]]}
          onMoviePress={handleMoviePress}
          onSeeAllPress={() => handleSeeAll('Cyberpunk')}
        />

        {/* Sci-Fi Collection Row */}
        <MovieRow
          title="Khoa Học Viễn Tưởng Đỉnh Cao"
          iconName="planet-outline"
          movies={[allMockMovies[2], allMockMovies[3], allMockMovies[5], allMockMovies[1]]}
          onMoviePress={handleMoviePress}
          onSeeAllPress={() => handleSeeAll('Sci-Fi')}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Multi-version Modal */}
      {mockMovie.episodes[0]?.versions && (
        <VersionSelectorModal
          visible={versionModalVisible}
          onClose={() => setVersionModalVisible(false)}
          versions={mockMovie.episodes[0].versions}
          selectedVersionId="v-ep1-3"
          onSelectVersion={() => setVersionModalVisible(false)}
        />
      )}

      {/* AI Compliance Modal */}
      <AIComplianceModal
        visible={complianceModalVisible}
        onClose={() => setComplianceModalVisible(false)}
        compliance={mockMovie.aiCompliance}
      />
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
