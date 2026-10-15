import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../src/store/useAppStore';
import { useEpisodeGate } from '../../src/hooks/useEpisodeGate';
import { movieService } from '../../src/services';
import { Movie, Episode } from '../../src/types/movie';
import { Header } from '../../src/components/common/Header';
import { AIComplianceModal } from '../../src/components/player/AIComplianceModal';
import { UnlockEpisodeModal } from '../../src/components/player/UnlockEpisodeModal';
import { AudioModeTabs, trackFor, type AudioMode } from '../../src/components/movie/AudioModeTabs';
import { EpisodeList } from '../../src/components/movie/EpisodeList';
import { LikeButton, compactCount, useMovieEngagement } from '../../src/components/movie/LikeButton';

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentMovie, setCurrentMovie, openAuthModal, isAuthenticated, movies, myList, toggleMyList, user, isVIPMode } = useAppStore();

  const foundMovie = movies.find((item) => item.id === id) || (currentMovie?.id === id ? currentMovie : null);

  const [movie, setMovie] = useState<Movie | null>(foundMovie);
  const [loading, setLoading] = useState(!foundMovie);
  const [audioMode, setAudioMode] = useState<AudioMode>('subtitle');
  const [chosenTrack, setChosenTrack] = useState<string | null>(null);
  const [engagement] = useMovieEngagement(id);

  const [complianceModalOpen, setComplianceModalOpen] = useState(false);

  // Movie list/detail responses carry no episodes, so they are always fetched separately.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const { movies: listed, currentMovie: selected } = useAppStore.getState();
    const known = listed.find((item) => item.id === id) || (selected?.id === id ? selected : null);
    setLoading(!known);

    Promise.all([
      known ? Promise.resolve(known) : movieService.getMovieDetail(id).then((res) => (res.success ? res.data : null)),
      movieService.getEpisodes(id),
    ]).then(([base, episodesRes]) => {
      if (cancelled) return;
      if (base) {
        const episodes = episodesRes.data;
        const loaded: Movie = { ...base, episodes, totalEpisodes: episodes.length || base.totalEpisodes };
        setMovie(loaded);
        setCurrentMovie(loaded);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [id, setCurrentMovie]);

  // Released episodes only; a movie with none says so instead of showing placeholders.
  const episodes: Episode[] = movie?.episodes ?? [];

  // The watch screen starts in the mode chosen here: subtitles on (Phụ đề) or the film's own audio (Thuyết minh).
  const watch = (ep: Episode) => router.push({ pathname: '/watch/[id]', params: { id, episodeId: ep.id, mode: audioMode } });
  // Every episode is opened through the BE access decision (free starter, plan, purchase).
  const gate = useEpisodeGate(watch);
  const handleSelectEpisode = (ep: Episode) => void gate.open(ep);

  const handleWatchNow = () => {
    if (episodes.length > 0) {
      handleSelectEpisode(episodes[0]);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ color: '#94A3B8', marginTop: 10, fontSize: 13 }}>Đang tải thông tin phim...</Text>
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={[styles.movieTitle, { color: '#FFFFFF', marginTop: 12 }]}>Không tìm thấy phim</Text>
        <TouchableOpacity
          style={styles.backBtnFallback}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnFallbackText}>Quay lại trang chủ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAdded = myList.includes(movie.id);

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      {/* Top Header */}
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Backdrop & Poster Card Section (Images 2, 3, 4 style) */}
        <View style={styles.heroSection}>
          <Image source={{ uri: movie.bannerUrl || movie.posterUrl }} style={styles.backdropImage} />
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)', '#000000']}
            style={styles.heroGradient}
          />

          <View style={styles.posterCardWrapper}>
            <Image source={{ uri: movie.posterUrl || movie.bannerUrl }} style={styles.posterImage} />
          </View>
        </View>

        {/* Movie Meta Information */}
        <View style={styles.metaContainer}>
          <View style={styles.badgeRow}>
            <View style={styles.fhdBadge}>
              <Text style={styles.fhdText}>FHD</Text>
            </View>
            <Text style={styles.yearText}>{movie.year || 2026}</Text>
          </View>

          <Text style={styles.movieTitle} numberOfLines={2}>
            {movie.title}
          </Text>
          <Text style={styles.movieSubtitle}>
            {movie.description ? movie.description.slice(0, 50) + '...' : 'AI Cinema Original'}
          </Text>

          {/* Release Date info */}
          <View style={styles.releaseInfoRow}>
            <Ionicons name="calendar-outline" size={14} color="#F59E0B" />
            <Text style={styles.releaseInfoText}>
              {episodes.length} tập đã phát hành · {compactCount(engagement?.viewCount ?? 0)} lượt xem · {compactCount(engagement?.likeCount ?? 0)} tim
            </Text>
          </View>

          {/* Primary Action Buttons (Green as requested in reference images) */}
          <View style={styles.actionButtonsCol}>
            <TouchableOpacity
              style={styles.greenPrimaryBtn}
              activeOpacity={0.85}
              onPress={handleWatchNow}
            >
              <Ionicons name="play" size={16} color="#FFFFFF" />
              <Text style={styles.greenPrimaryBtnText}>XEM NGAY</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.darkSecondaryBtn}
              activeOpacity={0.85}
              onPress={() => Alert.alert('Xem chung', 'Tính năng Xem chung phòng ảo AI Room đang phát triển.')}
            >
              <Ionicons name="people" size={16} color="#FFFFFF" />
              <Text style={styles.darkSecondaryBtnText}>Xem chung</Text>
            </TouchableOpacity>
          </View>

          {/* Action Icons Row (Like, Bookmark, Share) */}
          <View style={styles.iconActionsRow}>
            <LikeButton movieId={movie.id} />

            <TouchableOpacity
              style={styles.iconActionItem}
              onPress={() => toggleMyList(movie.id)}
            >
              <Ionicons name={isAdded ? 'bookmark' : 'bookmark-outline'} size={18} color={isAdded ? '#10B981' : '#FFFFFF'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconActionItem}
              onPress={() => Alert.alert('Chia sẻ', 'Đã sao chép liên kết phim vào clipboard.')}
            >
              <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* AI Compliance Info Pill */}
          <TouchableOpacity
            style={styles.compliancePill}
            onPress={() => setComplianceModalOpen(true)}
          >
            <MaterialCommunityIcons name="shield-check" size={14} color="#10B981" />
            <Text style={styles.compliancePillText}>
              {movie.aiCompliance.complianceArticle || 'Tuân thủ Điều 44 Luật AI'} (Điểm: {movie.aiCompliance.moderationScore}%)
            </Text>
            <Ionicons name="chevron-forward" size={12} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* Phụ đề = subtitles on; Thuyết minh = the film's own audio. The choice carries over to the player. */}
        <AudioModeTabs
          mode={audioMode}
          onModeChange={setAudioMode}
          tracks={episodes[0]?.subtitles ?? []}
          trackId={trackFor(audioMode, episodes[0]?.subtitles ?? [], chosenTrack)}
          onTrackChange={setChosenTrack}
          language={movie.language}
        />

        <EpisodeList episodes={episodes} isVIPMode={isVIPMode} posterUrl={movie.posterUrl} onSelect={handleSelectEpisode} />
        {/* Comments Section (as seen in image 4) */}
        <View style={styles.commentsSection}>
          <View style={styles.commentHeaderRow}>
            <Ionicons name="chatbubbles" size={16} color="#10B981" />
            <Text style={styles.commentHeading}>Bình luận (1)</Text>
          </View>

          {!isAuthenticated ? (
            <View style={styles.commentLoginCard}>
              <Text style={styles.commentLoginText}>Đăng nhập để tham gia thảo luận cùng cộng đồng</Text>
              <TouchableOpacity
                style={styles.commentLoginBtn}
                onPress={() => openAuthModal('login')}
              >
                <Text style={styles.commentLoginBtnText}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.commentCard}>
              <View style={styles.commentUserRow}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarInitial}>{user?.name?.charAt(0) || 'U'}</Text>
                </View>
                <View>
                  <Text style={styles.commentUserName}>{user?.name || 'Thành viên'}</Text>
                  <Text style={styles.commentTime}>Vừa xong</Text>
                </View>
              </View>
              <Text style={styles.commentContent}>Phim AI xem cuốn quá, chất lượng hình ảnh đỉnh cao!</Text>
            </View>
          )}

          {/* Sample Community Comment */}
          <View style={styles.commentCard}>
            <View style={styles.commentUserRow}>
              <View style={[styles.commentAvatar, { backgroundColor: '#EC4899' }]}>
                <Text style={styles.commentAvatarInitial}>T</Text>
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.commentUserName}>Trâm Quỳnh</Text>
                  <View style={styles.commentEpTag}>
                    <Text style={styles.commentEpTagText}>Tập 1</Text>
                  </View>
                </View>
                <Text style={styles.commentTime}>4 ngày trước</Text>
              </View>
            </View>
            <Text style={styles.commentContent}>Nhịp phim nhanh đã man cứ cgiac như bấm x2 để xem v.</Text>
            <View style={styles.commentFooterRow}>
              <TouchableOpacity style={styles.likeBtn}>
                <Ionicons name="heart-outline" size={14} color="#94A3B8" />
                <Text style={styles.likeCount}>1</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.replyText}>Trả lời</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* AI Compliance Modal */}
      <AIComplianceModal
        visible={complianceModalOpen}
        onClose={() => setComplianceModalOpen(false)}
        compliance={movie.aiCompliance}
      />

      {/* Unlock Episode Modal */}
      <UnlockEpisodeModal locked={gate.locked} onClose={gate.close} onUnlocked={watch} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: '#0B0F19',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.45,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  posterCardWrapper: {
    width: 130,
    height: 185,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    marginBottom: -35,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 2,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  metaContainer: {
    paddingHorizontal: 16,
    paddingTop: 45,
    alignItems: 'center',
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fhdBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fhdText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  yearText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  movieTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  movieSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: -4,
  },
  releaseInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  releaseInfoText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonsCol: {
    width: '100%',
    gap: 10,
    marginTop: 12,
  },
  greenPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  greenPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  darkSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  darkSecondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  iconActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 10,
  },
  iconActionItem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  compliancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    gap: 6,
  },
  compliancePillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingVertical: 10,
    marginRight: 20,
    position: 'relative',
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#10B981',
  },
  serverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 10,
  },
  serverLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  serverScroll: {
    gap: 8,
  },
  serverPill: {
    backgroundColor: '#18181B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  serverPillActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  serverPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  serverPillTextActive: {
    color: '#FFFFFF',
  },
  episodesSection: {
    paddingHorizontal: 16,
    marginTop: 18,
    gap: 12,
  },
  episodesHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  episodesHeading: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  thumbnailSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  episodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  epGridButton: {
    width: '31%',
    backgroundColor: '#18181B',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  epGridButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  epGridButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  epGridButtonTextActive: {
    color: '#FFFFFF',
  },
  coinCostTag: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  commentsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentHeading: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  commentLoginCard: {
    backgroundColor: '#121212',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    gap: 10,
  },
  commentLoginText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  commentLoginBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  commentLoginBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  commentCard: {
    backgroundColor: '#121212',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    gap: 8,
  },
  commentUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  commentUserName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  commentTime: {
    color: '#71717A',
    fontSize: 10,
  },
  commentContent: {
    color: '#E4E4E7',
    fontSize: 12,
    lineHeight: 16,
  },
  commentEpTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  commentEpTagText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '700',
  },
  commentFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    color: '#94A3B8',
    fontSize: 11,
  },
  replyText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  titleFallback: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtnFallback: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  backBtnFallbackText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
