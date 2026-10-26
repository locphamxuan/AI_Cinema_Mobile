import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { useEpisodeGate } from '../../src/hooks/useEpisodeGate';
import { movieService } from '../../src/services';
import { engagementService } from '../../src/services/engagementService';
import { playbackService } from '../../src/services/playbackService';
import { Movie, Episode } from '../../src/types/movie';
import type { StreamingSession } from '../../src/types/playback';
import { episodeLabel } from '../../src/lib/episodeLabel';
import { UnlockEpisodeModal } from '../../src/components/player/UnlockEpisodeModal';
import { EpisodePlayer } from '../../src/components/player/EpisodePlayer';
import { AudioModeTabs, languageName, trackFor, type AudioMode } from '../../src/components/movie/AudioModeTabs';
import { EpisodeList } from '../../src/components/movie/EpisodeList';
import { LikeButton, compactCount, useMovieEngagement } from '../../src/components/movie/LikeButton';
import { SaveButton } from '../../src/components/movie/SaveButton';
import { Button } from '../../src/components/common/Button';
import { useTheme } from '../../src/theme';
import { styles } from '../../src/styles/screens/watch/id.styles';

/** MF-4 refusals the member clears by removing a device or ending a stream elsewhere. */
const DEVICE_LIMITS = new Set(['DEVICE_LIMIT_REACHED', 'CONCURRENT_LIMIT_REACHED']);

export default function WatchScreen() {
  const { id, episodeId, mode } = useLocalSearchParams<{ id: string; episodeId?: string; mode?: AudioMode }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { currentMovie, setCurrentMovie, movies, isVIPMode } = useAppStore();

  const foundMovie = movies.find((item) => item.id === id) || (currentMovie?.id === id ? currentMovie : null);

  const [movie, setMovie] = useState<Movie | null>(foundMovie);
  const [loading, setLoading] = useState(!foundMovie);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(foundMovie?.episodes?.[0] || null);
  const [audioMode, setAudioMode] = useState<AudioMode>(mode === 'voiceover' ? 'voiceover' : 'subtitle');
  const [chosenTrack, setChosenTrack] = useState<string | null>(null);
  const [session, setSession] = useState<StreamingSession | null>(null);
  const [opening, setOpening] = useState(false);
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

  // MF-3: a granted episode plays through a streaming session (ads, stream limit, progress).
  const play = async (ep: Episode) => {
    // Unmounting the current player stops its session (with its position) before the next one opens.
    setSession(null);
    setOpening(true);
    const res = await playbackService.openSession(ep.id);
    setOpening(false);
    if (!res.success || !res.data) {
      if (res.reason && DEVICE_LIMITS.has(res.reason)) {
        Alert.alert('Đã đạt giới hạn thiết bị', res.message, [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Quản lý thiết bị', onPress: () => router.push('/devices') },
        ]);
      } else {
        Alert.alert('Không phát được tập', res.message || 'Vui lòng thử lại.');
      }
      return;
    }
    setSession(res.data);
    setActiveEpisode({ ...ep, isUnlocked: true });
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

  if (loading || !movie) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.ruby} />
        ) : (
          <>
            <Text style={[styles.missingTitle, { color: colors.text }]}>Không tìm thấy phim này</Text>
            <Button label="Quay lại" variant="secondary" onPress={() => router.back()} style={styles.missingBtn} />
          </>
        )}
      </View>
    );
  }

  const ep = currentActiveEpisode;
  const playing = session && session.episodeId === ep?.id ? session : undefined;
  const namedEpisode = ep?.title && ep.title !== `Tập ${ep.episodeNumber}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ height: Math.max(insets.top, 10), backgroundColor: '#000000' }} />
      <EpisodePlayer
        streamUrl={playing?.stream.masterUrl ?? ''}
        session={playing}
        posterUrl={ep?.thumbnailUrl || movie.bannerUrl || movie.posterUrl}
        aiLabel={playing?.aiLabel?.text ?? ep?.aiLabel ?? null}
        checking={gate.checkingId !== null || opening}
        onRequestPlay={() => ep && handleSelectEpisode(ep)}
        subtitles={tracks}
        subtitleTrackId={subtitleTrackId}
        onSubtitleChange={changeTrack}
        audioLabel={languageName(movie.language)}
        onStarted={countView}
      />

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}>
        <View style={styles.head}>
          <TouchableOpacity style={styles.titleRow} onPress={() => router.back()} accessibilityLabel={`Quay lại ${movie.title}`}>
            <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
            <Text style={[styles.movieTitle, { color: colors.text }]} numberOfLines={1}>
              {movie.title}
            </Text>
          </TouchableOpacity>
          {ep ? (
            <Text style={[styles.episodeTitle, { color: colors.textSecondary }]} numberOfLines={2}>
              {episodeLabel(ep, episodes)}
              {namedEpisode ? `: ${ep.title}` : ''}
              {ep.duration ? `  (${ep.duration})` : ''}
            </Text>
          ) : null}
          {ep?.notice ? <Text style={[styles.notice, { color: colors.coin }]}>{ep.notice}</Text> : null}

          <View style={styles.actions}>
            <LikeButton movieId={movie.id} />
            <SaveButton movieId={movie.id} />
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.cardAlt }]}
              onPress={() => void Share.share({ message: `Xem "${movie.title}" trên AI Cinema` })}
              accessibilityLabel="Chia sẻ"
            >
              <Ionicons name="share-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.views, { color: colors.textMuted }]}>{compactCount(engagement?.viewCount ?? 0)} lượt xem</Text>
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
          currentId={ep?.id}
          isVIPMode={isVIPMode}
          posterUrl={movie.posterUrl}
          onSelect={handleSelectEpisode}
        />

        {ep?.synopsis ? (
          <View style={styles.about}>
            <Text style={[styles.aboutTitle, { color: colors.text }]}>Nội dung tập {ep.episodeNumber}</Text>
            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>{ep.synopsis}</Text>
          </View>
        ) : null}
      </ScrollView>

      <UnlockEpisodeModal locked={gate.locked} onClose={gate.close} onUnlocked={play} />
    </View>
  );
}
