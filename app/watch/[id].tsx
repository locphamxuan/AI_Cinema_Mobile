import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/useAppStore';
import { useEpisodeGate } from '../../src/hooks/useEpisodeGate';
import { movieService } from '../../src/services';
import { engagementService } from '../../src/services/engagementService';
import { episodeAccessService } from '../../src/services/episodeAccessService';
import { Movie, Episode } from '../../src/types/movie';
import { Header } from '../../src/components/common/Header';
import { UnlockEpisodeModal } from '../../src/components/player/UnlockEpisodeModal';
import { EpisodePlayer } from '../../src/components/player/EpisodePlayer';
import { AudioModeTabs, languageName, trackFor, type AudioMode } from '../../src/components/movie/AudioModeTabs';
import { EpisodeList } from '../../src/components/movie/EpisodeList';
import { LikeButton, compactCount, useMovieEngagement } from '../../src/components/movie/LikeButton';

export default function WatchScreen() {
  const { id, episodeId, mode } = useLocalSearchParams<{ id: string; episodeId?: string; mode?: AudioMode }>();
  const router = useRouter();
  const { currentMovie, setCurrentMovie, movies, myList, toggleMyList, isVIPMode } = useAppStore();

  const foundMovie = movies.find((item) => item.id === id) || (currentMovie?.id === id ? currentMovie : null);

  const [movie, setMovie] = useState<Movie | null>(foundMovie);
  const [loading, setLoading] = useState(!foundMovie);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(foundMovie?.episodes?.[0] || null);
  const [audioMode, setAudioMode] = useState<AudioMode>(mode === 'voiceover' ? 'voiceover' : 'subtitle');
  const [chosenTrack, setChosenTrack] = useState<string | null>(null);
  const [autoNext, setAutoNext] = useState(false);
  const [engagement, setEngagement] = useMovieEngagement(id);
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
  const tracks = currentActiveEpisode?.subtitles ?? [];
  const subtitleTrackId = trackFor(audioMode, tracks, chosenTrack);

  const play = async (ep: Episode) => {
    // After a purchase the episode carries no stream yet: ask the BE again, it decides.
    const streamUrl = ep.hlsUrl || (await episodeAccessService.checkAccess(ep.id)).data?.streamUrl || '';
    setActiveEpisode({ ...ep, hlsUrl: streamUrl, isUnlocked: true });
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };
  // Every episode is opened through the BE access decision (free starter, plan, purchase).
  const gate = useEpisodeGate(play);
  const handleSelectEpisode = (ep: Episode) => void gate.open(ep);

  const countView = useCallback(() => {
    if (!currentActiveEpisode) return;
    void engagementService.recordView(currentActiveEpisode.id).then((res) => {
      if (res.success && res.data.counted && engagement) setEngagement({ ...engagement, viewCount: engagement.viewCount + 1 });
    });
  }, [currentActiveEpisode, engagement, setEngagement]);

  const changeTrack = (trackId: string | null) => {
    if (trackId) setChosenTrack(trackId);
    setAudioMode(trackId ? 'subtitle' : 'voiceover');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF3D7F" />
        <Text style={styles.loadingText}>Đang tải thông tin phim...</Text>
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={[styles.container, styles.centered, { padding: 20 }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={[styles.screenMovieTitle, { marginTop: 12 }]}>Không tìm thấy phim</Text>
        <TouchableOpacity style={styles.backBtnFallback} onPress={() => router.back()}>
          <Text style={styles.backBtnFallbackText}>Quay lại trang chủ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAdded = myList.includes(movie.id);

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <EpisodePlayer
          streamUrl={currentActiveEpisode?.hlsUrl || ''}
          posterUrl={currentActiveEpisode?.thumbnailUrl || movie.bannerUrl || movie.posterUrl}
          aiLabel={currentActiveEpisode?.aiLabel ?? null}
          checking={gate.checkingId !== null}
          onRequestPlay={() => currentActiveEpisode && handleSelectEpisode(currentActiveEpisode)}
          subtitles={tracks}
          subtitleTrackId={subtitleTrackId}
          onSubtitleChange={changeTrack}
          audioLabel={languageName(movie.language)}
          onStarted={countView}
        />

        <View style={styles.playerTogglesRow}>
          <Text style={styles.toggleLabel}>Chuyển tập</Text>
          <TouchableOpacity style={[styles.miniToggleBtn, autoNext && styles.miniToggleBtnActive]} onPress={() => setAutoNext(!autoNext)}>
            <Text style={[styles.miniToggleText, autoNext && styles.miniToggleTextActive]}>{autoNext ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>
          <Text style={styles.viewCount}>
            <Ionicons name="eye-outline" size={12} color="#8E8E93" /> {compactCount(engagement?.viewCount ?? 0)} lượt xem
          </Text>
        </View>

        <View style={styles.titleActionSection}>
          <View style={styles.backTitleRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backArrowBtn} accessibilityLabel="Quay lại">
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.screenMovieTitle} numberOfLines={1}>
              {movie.title}
            </Text>
          </View>
          <Text style={styles.screenMovieSub} numberOfLines={2}>
            {movie.description || 'AI Cinema Original'}
          </Text>

          <View style={styles.toolsRow}>
            <LikeButton movieId={movie.id} />
            <TouchableOpacity style={styles.toolBtn} onPress={() => toggleMyList(movie.id)} accessibilityLabel="Lưu phim">
              <Ionicons name={isAdded ? 'bookmark' : 'bookmark-outline'} size={18} color={isAdded ? '#FF3D7F' : '#FFFFFF'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={() => Alert.alert('Chia sẻ', 'Đã sao chép liên kết.')} accessibilityLabel="Chia sẻ">
              <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <AudioModeTabs
          mode={audioMode}
          onModeChange={setAudioMode}
          tracks={tracks}
          trackId={subtitleTrackId}
          onTrackChange={(trackId) => changeTrack(trackId)}
          language={movie.language}
        />

        <EpisodeList
          episodes={episodes}
          currentId={currentActiveEpisode?.id}
          isVIPMode={isVIPMode}
          posterUrl={movie.posterUrl}
          onSelect={handleSelectEpisode}
        />

        {activeEpisode && (
          <View style={styles.episodeInfo}>
            <View style={styles.aiLabelRow}>
              <MaterialCommunityIcons name="robot-outline" size={14} color="#FF3D7F" />
              <Text style={styles.aiLabelText}>{activeEpisode.aiLabel || 'Nội dung được tạo bởi AI'}</Text>
            </View>
            {activeEpisode.duration ? <Text style={styles.episodeInfoText}>Thời lượng: {activeEpisode.duration}</Text> : null}
            {activeEpisode.notice ? <Text style={styles.episodeNoticeText}>{activeEpisode.notice}</Text> : null}
          </View>
        )}
      </ScrollView>

      <UnlockEpisodeModal locked={gate.locked} onClose={gate.close} onUnlocked={play} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#8E8E93', marginTop: 10, fontSize: 13 },
  scrollContent: { paddingBottom: 40 },
  playerTogglesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    gap: 8,
  },
  toggleLabel: { color: '#8E8E93', fontSize: 12, fontWeight: '600' },
  miniToggleBtn: { backgroundColor: '#27272A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  miniToggleBtnActive: { backgroundColor: '#FF3D7F' },
  miniToggleText: { color: '#8E8E93', fontSize: 10, fontWeight: '800' },
  miniToggleTextActive: { color: '#FFFFFF' },
  viewCount: { marginLeft: 'auto', color: '#8E8E93', fontSize: 11, fontWeight: '600' },
  titleActionSection: { paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  backTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrowBtn: { padding: 2 },
  screenMovieTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', flex: 1 },
  screenMovieSub: { color: '#8E8E93', fontSize: 12, marginLeft: 26, marginTop: -2 },
  toolsRow: { flexDirection: 'row', alignItems: 'flex-start', marginLeft: 26, gap: 20, marginTop: 6 },
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
  episodeInfo: { marginTop: 14, gap: 6, paddingHorizontal: 16 },
  aiLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiLabelText: { color: '#FF3D7F', fontSize: 12, fontWeight: '700' },
  episodeInfoText: { color: '#8E8E93', fontSize: 12 },
  episodeNoticeText: { color: '#F59E0B', fontSize: 12 },
  backBtnFallback: { backgroundColor: '#FF3D7F', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginTop: 12 },
  backBtnFallbackText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});
