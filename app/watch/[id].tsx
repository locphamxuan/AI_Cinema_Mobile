import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/useAppStore';
import { useEpisodeGate } from '../../src/hooks/useEpisodeGate';
import { movieService } from '../../src/services';
import { Movie, Episode } from '../../src/types/movie';
import { Header } from '../../src/components/common/Header';
import { AIComplianceModal } from '../../src/components/player/AIComplianceModal';
import { UnlockEpisodeModal } from '../../src/components/player/UnlockEpisodeModal';
import { EpisodePlayer } from '../../src/components/player/EpisodePlayer';
import { episodeAccessService } from '../../src/services/episodeAccessService';

export default function WatchScreen() {
  const { id, episodeId } = useLocalSearchParams<{ id: string; episodeId?: string }>();
  const router = useRouter();
  const { currentMovie, setCurrentMovie, movies, myList, toggleMyList, isVIPMode } = useAppStore();

  const foundMovie = movies.find((item) => item.id === id) || (currentMovie?.id === id ? currentMovie : null);

  const [movie, setMovie] = useState<Movie | null>(foundMovie);
  const [loading, setLoading] = useState(!foundMovie);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(foundMovie?.episodes?.[0] || null);
  const [activeTab, setActiveTab] = useState<'subtitle' | 'voiceover' | 'recommend' | 'cast'>('subtitle');
  const [selectedServer, setSelectedServer] = useState('Vietsub (SN)');
  const [autoNext, setAutoNext] = useState(false);
  const [skipIntro, setSkipIntro] = useState(false);
  const [showThumbnailGrid, setShowThumbnailGrid] = useState(false);

  const [complianceModalOpen, setComplianceModalOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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
        setActiveEpisode(episodes.find((ep) => ep.id === episodeId) || episodes[0] || null);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [id, setCurrentMovie, episodeId]);

  // Released episodes only; a movie with none says so instead of showing placeholders.
  const episodes: Episode[] = movie?.episodes ?? [];

  const currentActiveEpisode = activeEpisode || episodes[0] || null;

  const play = async (ep: Episode) => {
    // After a purchase the episode carries no stream yet: ask the BE again, it decides.
    const streamUrl = ep.hlsUrl || (await episodeAccessService.checkAccess(ep.id)).data?.streamUrl || '';
    setActiveEpisode({ ...ep, hlsUrl: streamUrl, isUnlocked: true });
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };
  // Every episode is opened through the BE access decision (free starter, plan, purchase).
  const gate = useEpisodeGate(play);
  const handleSelectEpisode = (ep: Episode) => void gate.open(ep);

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
        <Text style={[styles.screenMovieTitle, { marginTop: 12 }]}>Không tìm thấy phim</Text>
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

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <EpisodePlayer
          streamUrl={currentActiveEpisode?.hlsUrl || ''}
          posterUrl={currentActiveEpisode?.thumbnailUrl || movie.bannerUrl || movie.posterUrl}
          aiLabel={currentActiveEpisode?.aiLabel ?? null}
          checking={gate.checkingId !== null}
          onRequestPlay={() => currentActiveEpisode && handleSelectEpisode(currentActiveEpisode)}
        />

        {/* Toggles Row: Chuyển tập & Skip giới thiệu */}
        <View style={styles.playerTogglesRow}>
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Chuyển tập</Text>
            <TouchableOpacity
              style={[styles.miniToggleBtn, autoNext && styles.miniToggleBtnActive]}
              onPress={() => setAutoNext(!autoNext)}
            >
              <Text style={[styles.miniToggleText, autoNext && styles.miniToggleTextActive]}>
                {autoNext ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Skip giới thiệu</Text>
            <TouchableOpacity
              style={[styles.miniToggleBtn, skipIntro && styles.miniToggleBtnActive]}
              onPress={() => setSkipIntro(!skipIntro)}
            >
              <Text style={[styles.miniToggleText, skipIntro && styles.miniToggleTextActive]}>
                {skipIntro ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Movie Title & Action Buttons Row (Image 2 style) */}
        <View style={styles.titleActionSection}>
          <View style={styles.backTitleRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backArrowBtn}>
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.screenMovieTitle} numberOfLines={1}>{movie.title}</Text>
          </View>
          <Text style={styles.screenMovieEnglishSub}>{movie.description ? movie.description.slice(0, 45) + '...' : 'AI Cinema Original'}</Text>

          {/* Action Tools Row (Camera, Heart, Bookmark, Share) */}
          <View style={styles.toolsRow}>
            <TouchableOpacity style={styles.toolBtn} onPress={() => Alert.alert('Chụp ảnh', 'Đã lưu ảnh màn hình vào thư viện.')}>
              <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={() => Alert.alert('Đã thích', 'Đã thêm vào danh sách yêu thích.')}>
              <Ionicons name="heart-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={() => toggleMyList(movie.id)}>
              <Ionicons name={isAdded ? 'bookmark' : 'bookmark-outline'} size={18} color={isAdded ? '#10B981' : '#FFFFFF'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={() => Alert.alert('Chia sẻ', 'Đã sao chép liên kết.')}>
              <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs Row (Phụ đề, Thuyết minh, Đề xuất, Diễn viên) */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'subtitle' && styles.tabItemActive]}
            onPress={() => setActiveTab('subtitle')}
          >
            <Text style={[styles.tabText, activeTab === 'subtitle' && styles.tabTextActive]}>PHỤ ĐỀ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'voiceover' && styles.tabItemActive]}
            onPress={() => setActiveTab('voiceover')}
          >
            <Text style={[styles.tabText, activeTab === 'voiceover' && styles.tabTextActive]}>THUYẾT MINH</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'recommend' && styles.tabItemActive]}
            onPress={() => setActiveTab('recommend')}
          >
            <Text style={[styles.tabText, activeTab === 'recommend' && styles.tabTextActive]}>ĐỀ XUẤT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'cast' && styles.tabItemActive]}
            onPress={() => setActiveTab('cast')}
          >
            <Text style={[styles.tabText, activeTab === 'cast' && styles.tabTextActive]}>DIỄN VIÊN</Text>
          </TouchableOpacity>
        </View>

        {/* Server Selection Pills */}
        <View style={styles.serverSection}>
          <Text style={styles.serverLabel}>MÁY CHỦ:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serverScroll}>
            {['Vietsub (SN)', 'Vietsub #1 (NC)', 'Vietsub AI Pro'].map((server) => {
              const isSelected = selectedServer === server;
              return (
                <TouchableOpacity
                  key={server}
                  style={[styles.serverPill, isSelected && styles.serverPillActive]}
                  onPress={() => setSelectedServer(server)}
                >
                  <Text style={[styles.serverPillText, isSelected && styles.serverPillTextActive]}>
                    {server} | {episodes.length}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Episodes Grid / List Section (as seen in image 2) */}
        <View style={styles.episodesSection}>
          <View style={styles.episodesHeadingRow}>
            <Text style={styles.episodesHeading}>
              Danh sách tập ({currentActiveEpisode?.episodeNumber || 1} / {episodes.length})
            </Text>
            <View style={styles.thumbnailSwitchRow}>
              <Text style={styles.switchLabel}>Hiện ảnh</Text>
              <Switch
                value={showThumbnailGrid}
                onValueChange={setShowThumbnailGrid}
                trackColor={{ false: '#27272A', true: '#10B981' }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor="#27272A"
              />
            </View>
          </View>

          {/* Episode Buttons Grid */}
          <View style={styles.episodeGrid}>
            {episodes.map((ep) => {
              const isCurrent = ep.id === currentActiveEpisode?.id;
              const isUnderRevision = ep.availability === 'UNDER_REVISION';
              // A hint only: the BE decides when the episode is opened.
              const isLocked = !isVIPMode && !ep.isFree && !ep.isUnlocked;

              return (
                <TouchableOpacity
                  key={ep.id}
                  style={[styles.epGridButton, isCurrent && styles.epGridButtonActive]}
                  activeOpacity={0.8}
                  onPress={() => handleSelectEpisode(ep)}
                >
                  <Ionicons
                    name={isUnderRevision ? 'construct' : isLocked ? 'lock-closed' : 'play'}
                    size={12}
                    color={isLocked ? '#F59E0B' : isCurrent ? '#FFFFFF' : '#FFFFFF'}
                  />
                  <Text style={[styles.epGridButtonText, isCurrent && styles.epGridButtonTextActive]} numberOfLines={1}>
                    Tập {ep.episodeNumber}
                  </Text>
                  {isLocked && <Text style={styles.coinCostTag}>{ep.price}C</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {movie.episodes.length === 0 && (
            <Text style={styles.episodeInfoText}>Phim chưa có tập nào được phát hành.</Text>
          )}

          {activeEpisode && (
            <View style={styles.episodeInfo}>
              <View style={styles.aiLabelRow}>
                <MaterialCommunityIcons name="robot-outline" size={14} color="#10B981" />
                <Text style={styles.aiLabelText}>{activeEpisode.aiLabel || 'Nội dung được tạo bởi AI'}</Text>
              </View>
              {activeEpisode.duration ? (
                <Text style={styles.episodeInfoText}>Thời lượng: {activeEpisode.duration}</Text>
              ) : null}
              {activeEpisode.notice ? <Text style={styles.episodeNoticeText}>{activeEpisode.notice}</Text> : null}
            </View>
          )}
        </View>
      </ScrollView>

      {/* AI Compliance Modal */}
      <AIComplianceModal
        visible={complianceModalOpen}
        onClose={() => setComplianceModalOpen(false)}
        compliance={movie.aiCompliance}
      />

      {/* Unlock Episode Modal */}
      <UnlockEpisodeModal locked={gate.locked} onClose={gate.close} onUnlocked={play} />
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
  playerContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#000000',
  },
  playerVideoBg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  playerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 12,
  },
  playerLockBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerCenterPlay: {
    alignSelf: 'center',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlIconBtn: {
    padding: 4,
  },
  timeLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  scrubberTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  scrubberFill: {
    width: '25%',
    height: '100%',
    backgroundColor: '#10B981',
  },
  playerTogglesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    gap: 20,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  miniToggleBtn: {
    backgroundColor: '#27272A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  miniToggleBtnActive: {
    backgroundColor: '#10B981',
  },
  miniToggleText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  miniToggleTextActive: {
    color: '#FFFFFF',
  },
  titleActionSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
  },
  backTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backArrowBtn: {
    padding: 2,
  },
  screenMovieTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
  },
  screenMovieEnglishSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginLeft: 26,
    marginTop: -2,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 26,
    gap: 20,
    marginTop: 6,
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
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
  episodeInfo: {
    marginTop: 14,
    gap: 6,
  },
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiLabelText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  episodeInfoText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  episodeNoticeText: {
    color: '#F59E0B',
    fontSize: 12,
  },
  coinCostTag: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
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
