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
import { Header } from '../../src/components/common/Header';
import { HeroBanner } from '../../src/components/home/HeroBanner';
import { CategoryPills } from '../../src/components/home/CategoryPills';
import { TopRankRow } from '../../src/components/home/TopRankRow';
import { MovieRow } from '../../src/components/home/MovieRow';
import { VersionSelectorModal } from '../../src/components/player/VersionSelectorModal';
import { AIComplianceModal } from '../../src/components/player/AIComplianceModal';
import { useTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/useAppStore';
import { allMockMovies, mockMovie } from '../../src/mocks/mockData';
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
        {/* Guest Announcement Banner if unauthenticated */}
        {!isAuthenticated && (
          <View
            style={[
              styles.guestBanner,
              {
                backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                borderColor: colors.ruby,
              },
            ]}
          >
            <View style={styles.guestBannerContent}>
              <View style={styles.guestIcon}>
                <Ionicons name="sparkles" size={18} color="#E50914" />
              </View>
              <View style={styles.guestTextContainer}>
                <Text style={[styles.guestTitle, { color: colors.text }]}>
                  Đăng Nhập Nhận 50 Coin Thưởng
                </Text>
                <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>
                  Trải nghiệm phim AI 4K, hỗ trợ tạo sinh trong Studio AI
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.guestBtn, { backgroundColor: colors.ruby }]}
              onPress={() => openAuthModal('login')}
            >
              <Text style={styles.guestBtnText}>Đăng Nhập</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Featured Hero Banner */}
        <HeroBanner
          movie={mockMovie}
          onPlayPress={() => handleMoviePress(mockMovie)}
          onDetailPress={() => setVersionModalVisible(true)}
        />

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
          movies={allMockMovies}
          onMoviePress={handleMoviePress}
        />

        {/* Cyberpunk Collection Row */}
        <MovieRow
          title="Tuyển Tập Cyberpunk 2049"
          movies={[allMockMovies[1], allMockMovies[4], allMockMovies[0], allMockMovies[3]]}
          onMoviePress={handleMoviePress}
        />

        {/* Sci-Fi Collection Row */}
        <MovieRow
          title="Khoa Học Viễn Tưởng Đỉnh Cao"
          movies={[allMockMovies[2], allMockMovies[3], allMockMovies[5], allMockMovies[1]]}
          onMoviePress={handleMoviePress}
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
    paddingBottom: 20,
  },
  guestBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  guestBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  guestIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTextContainer: {
    flex: 1,
    gap: 2,
  },
  guestTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  guestSubtitle: {
    fontSize: 10,
  },
  guestBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  guestBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 30,
  },
});
