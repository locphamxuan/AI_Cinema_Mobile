import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { showDialog } from '../../src/lib/dialog';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore, useCatalogStore, useSessionStore, useUiStore } from '../../src/store';
import { useEpisodeGate } from '../../src/hooks/useEpisodeGate';
import { useMovieWithEpisodes } from '../../src/hooks/useMovieWithEpisodes';
import { LoadError } from '../../src/components/common/LoadError';
import { engagementService } from '../../src/services/engagementService';
import { playbackService } from '../../src/services/playbackService';
import { Episode } from '../../src/types/movie';
import type { StreamingSession } from '../../src/types/playback';
import { episodeLabel } from '../../src/lib/episodeLabel';
import { UnlockEpisodeModal } from '../../src/components/player/UnlockEpisodeModal';
import { EpisodePlayer } from '../../src/components/player/EpisodePlayer';
import { SubtitleChips, languageName, trackFor } from '../../src/components/movie/SubtitleChips';
import { EpisodeList } from '../../src/components/movie/EpisodeList';
import { RecommendationRail } from '../../src/components/movie/RecommendationRail';
import { useAfterWatching } from '../../src/hooks/useAfterWatching';
import { LikeButton, compactCount, useMovieEngagement } from '../../src/components/movie/LikeButton';
import { SaveButton } from '../../src/components/movie/SaveButton';
import { Button } from '../../src/components/common/Button';
import { useTheme } from '../../src/theme';
import { styles } from '../../src/styles/screens/watch/id.styles';

/** MF-4 refusals the member clears by removing a device or ending a stream elsewhere. */
const DEVICE_LIMITS = new Set(['DEVICE_LIMIT_REACHED', 'CONCURRENT_LIMIT_REACHED']);

export default function WatchScreen() {
  const { id, episodeId, subtitles } = useLocalSearchParams<{ id: string; episodeId?: string; subtitles?: 'off' }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isVIPMode } = useAccountStore();
  const { currentMovie, movies } = useCatalogStore();

  const foundMovie = movies.find((item) => item.id === id) || (currentMovie?.id === id ? currentMovie : null);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(foundMovie?.episodes?.[0] || null);
  const { movie, loading, error: loadError, retry } = useMovieWithEpisodes(id, (loaded) =>
    setActiveEpisode(loaded.episodes.find((ep) => ep.id === episodeId) || loaded.episodes[0] || null),
  );
  const [subtitlesOn, setSubtitlesOn] = useState(subtitles !== 'off');
  const [chosenTrack, setChosenTrack] = useState<string | null>(null);
  const [session, setSession] = useState<StreamingSession | null>(null);
  const [opening, setOpening] = useState(false);
  const openingRef = useRef(false);
  const [engagement, setEngagement] = useMovieEngagement(id);
  const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);


  // Released episodes only; a movie with none says so instead of showing placeholders.
  const episodes: Episode[] = movie?.episodes ?? [];
  const currentActiveEpisode = activeEpisode || episodes[0] || null;
  const tracks = currentActiveEpisode?.subtitles ?? [];
  const subtitleTrackId = trackFor(subtitlesOn, tracks, chosenTrack);

  // BR-68: once the member has seen the last episode through (85 % or its end), the AI suggests what to watch
  // next from this account's own behaviour (Member only; a Guest has no history to read).
  const { isAuthenticated } = useSessionStore();
  const lastEpisodeNumber = episodes.reduce((max, e) => Math.max(max, e.episodeNumber), 0);
  // Another episode on screen shows none of the picks of the one just finished.
  const after = useAfterWatching(movie?.id, currentActiveEpisode?.id);
  const loadAfter = after.load;
  const onFinished = useCallback(() => {
    if (!isAuthenticated || !currentActiveEpisode) return;
    if (currentActiveEpisode.episodeNumber < lastEpisodeNumber) return;
    loadAfter();
  }, [isAuthenticated, currentActiveEpisode, lastEpisodeNumber, loadAfter]);

  // BR-69: the lobby opens the room on this episode (the BE checks the Host's own right to watch it) and invites friends.
  const startWatchParty = useCallback(() => {
    if (!currentActiveEpisode || !movie) return;
    const label = encodeURIComponent(`${movie.title} · Tập ${currentActiveEpisode.episodeNumber}`);
    router.push(`/watch-party/create?episodeId=${currentActiveEpisode.id}&label=${label}` as Href);
  }, [currentActiveEpisode, movie, router]);

  // A T18 episode opens only for a member the BE knows is 18 or older (AGE_RESTRICTED otherwise).
  const user = useSessionStore((s) => s.user);
  const openAuthModal = useUiStore((s) => s.openAuthModal);
  const explainAgeLimit = () => {
    const title = 'Tập dành cho người từ 18 tuổi';
    if (!isAuthenticated) {
      return showDialog(title, 'Đăng nhập bằng tài khoản đủ 18 tuổi để xem tập này.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => openAuthModal('login') },
      ]);
    }
    // A Google account may have no birthday yet: the member adds it on the Account screen.
    if (!user?.dateOfBirth) {
      return showDialog(title, 'Tài khoản chưa có ngày sinh. Thêm ngày sinh ở mục Tài khoản để xem tập này.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Cập nhật ngày sinh', onPress: () => router.push('/account') },
      ]);
    }
    showDialog(title, 'Tài khoản của bạn chưa đủ 18 tuổi nên chưa xem được tập này.');
  };

  // MF-3: a granted episode plays through a streaming session (ads, stream limit, progress).
  const play = async (ep: Episode) => {
    // One session at a time: a second one opened meanwhile would never be stopped and hold a stream slot.
    if (openingRef.current) return;
    openingRef.current = true;
    // Unmounting the current player stops its session (with its position) before the next one opens.
    setSession(null);
    setOpening(true);
    const res = await playbackService.openSession(ep.id);
    openingRef.current = false;
    setOpening(false);
    if (!res.success || !res.data) {
      if (res.reason === 'AGE_RESTRICTED') return explainAgeLimit();
      if (res.reason && DEVICE_LIMITS.has(res.reason)) {
        showDialog('Đã đạt giới hạn thiết bị', res.message, [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Quản lý thiết bị', onPress: () => router.push('/devices') },
        ]);
      } else {
        showDialog('Không phát được tập', res.message || 'Vui lòng thử lại.');
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
    setSubtitlesOn(trackId !== null);
  };

  if (loading || !movie) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.ruby} />
        ) : loadError ? (
          <LoadError message={loadError} onRetry={retry} />
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
        audioLabel={tracks.length > 0 ? languageName(movie.language) : undefined}
        onStarted={countView}
        onFinished={onFinished}
      />

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}>
        <RecommendationRail
          title="AI đề xuất cho bạn"
          caption={`Vì bạn vừa xem hết "${movie.title}"`}
          movies={after.movies}
          onMoviePress={(m) => router.replace({ pathname: '/movie/[id]', params: { id: m.id } })}
        />
        {after.error ? <LoadError message={after.error} onRetry={after.retry} /> : null}
        <View style={styles.head}>
          <TouchableOpacity style={styles.titleRow} onPress={() => router.back()} accessibilityLabel={`Quay lại ${movie.title}`}>
            <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
            <Text style={[styles.movieTitle, { color: colors.text }]} numberOfLines={1}>
                {movie.title}
            </Text>
            <Text style={[styles.movieGenre, { color: colors.textSecondary }]} numberOfLines={1}>
                {movie.genre?.join(', ') || ''}
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
            {isAuthenticated ? (
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.cardAlt }]}
                onPress={() =>
                  showDialog('Xem cùng nhóm', 'Mở phòng cho tập này hoặc vào phòng bạn bè đã tạo.', [
                    { text: 'Huỷ', style: 'cancel' },
                    { text: 'Nhập mã phòng', onPress: () => router.push('/watch-party/join' as Href) },
                    { text: 'Tạo phòng', onPress: startWatchParty },
                  ])
                }
                accessibilityLabel="Xem cùng nhóm"
              >
                <Ionicons name="people-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            ) : null}
            <Text style={[styles.views, { color: colors.textMuted }]}>{compactCount(engagement?.viewCount ?? 0)} lượt xem</Text>
          </View>
        </View>

        <SubtitleChips tracks={tracks} trackId={subtitleTrackId} onChange={changeTrack} />

        {loadError ? (
          <LoadError message={loadError} onRetry={retry} />
        ) : (
          <EpisodeList
            episodes={episodes}
            currentId={ep?.id}
            isVIPMode={isVIPMode}
            posterUrl={movie.posterUrl}
            onSelect={handleSelectEpisode}
          />
        )}

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
