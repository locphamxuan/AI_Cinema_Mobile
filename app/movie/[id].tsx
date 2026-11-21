import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Share, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionStore, useAccountStore } from '../../src/store';
import { useEpisodeGate } from '../../src/hooks/useEpisodeGate';
import { useMovieWithEpisodes } from '../../src/hooks/useMovieWithEpisodes';
import { LoadError } from '../../src/components/common/LoadError';
import { useWatchHistory } from '../../src/hooks/useWatchHistory';
import { resumeEpisode } from '../../src/lib/watchHistory';
import { Movie, Episode } from '../../src/types/movie';
import { AIComplianceModal } from '../../src/components/player/AIComplianceModal';
import { UnlockEpisodeModal } from '../../src/components/player/UnlockEpisodeModal';
import { SubtitleChips, trackFor } from '../../src/components/movie/SubtitleChips';
import { EpisodeList } from '../../src/components/movie/EpisodeList';
import { RecommendationRail } from '../../src/components/movie/RecommendationRail';
import { recommendationService } from '../../src/services/recommendationService';
import { LikeButton, compactCount, useMovieEngagement } from '../../src/components/movie/LikeButton';
import { SaveButton } from '../../src/components/movie/SaveButton';
import { Button } from '../../src/components/common/Button';
import { useTheme } from '../../src/theme';
import { styles } from '../../src/styles/screens/movie/id.styles';

export default function MovieDetailScreen() {
  // BR-68: "Phim tương tự" — same genres / country, released only; Guests see it too.
  const [similar, setSimilar] = useState<Movie[]>([]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { isAuthenticated } = useSessionStore();
  const { isVIPMode } = useAccountStore();
  const history = useWatchHistory(isAuthenticated);

  const { movie, loading, error: loadError, retry } = useMovieWithEpisodes(id);
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const [chosenTrack, setChosenTrack] = useState<string | null>(null);
  const [synopsisOpen, setSynopsisOpen] = useState(false);
  const [aiInfoOpen, setAiInfoOpen] = useState(false);
  const [engagement] = useMovieEngagement(id);


  // Released episodes only; a movie with none says so instead of showing placeholders.
  const episodes: Episode[] = movie?.episodes ?? [];

  // The watch screen starts with the subtitles chosen here (on or off).
  const watch = (ep: Episode) =>
    router.push({ pathname: '/watch/[id]', params: { id, episodeId: ep.id, ...(subtitlesOn ? {} : { subtitles: 'off' }) } });
  // Every episode is opened through the BE access decision (free starter, plan, purchase).
  const gate = useEpisodeGate(watch);
  const handleSelectEpisode = (ep: Episode) => void gate.open(ep);

  useEffect(() => {
    if (!id) return;
    let active = true;
    void recommendationService.similar(String(id)).then((res) => {
      if (active) setSimilar(res.success ? res.data : []);
    });
    return () => {
      active = false;
    };
  }, [id]);

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
            <Text style={[styles.missingText, { color: colors.textMuted }]}>Phim có thể đã bị gỡ hoặc đường dẫn không đúng.</Text>
            <Button label="Quay lại" variant="secondary" onPress={() => router.back()} style={styles.missingBtn} />
          </>
        )}
      </View>
    );
  }

  // "Xem tiếp" picks up from the member's BE watch history; otherwise the first episode.
  const resume = resumeEpisode(history, movie.id, episodes);
  const next = resume ?? episodes[0];
  const heroHeight = Math.min(Math.round(width * 1.1), 520);


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}>
        <View style={{ height: heroHeight, backgroundColor: colors.cardAlt }}>
          {movie.posterUrl || movie.bannerUrl ? (
            <Image source={{ uri: movie.posterUrl || movie.bannerUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : null}
          <LinearGradient colors={['transparent', colors.background]} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
        </View>

        <View style={styles.head}>
          <Text style={[styles.title, { color: colors.text }]}>{movie.title}</Text>
          <View style={styles.facts}>
            {movie.year ? <Text style={[styles.fact, { color: colors.textSecondary }]}>{movie.year}</Text> : null}
            {episodes.length > 0 ? <Text style={[styles.fact, { color: colors.textSecondary }]}>{episodes.length} tập</Text> : null}
            {movie.ageRating ? (
              <View style={[styles.age, { borderColor: colors.textMuted }]}>
                <Text style={[styles.ageText, { color: colors.textSecondary }]}>{movie.ageRating}</Text>
              </View>
            ) : null}
            <View style={styles.stat}>
              <Ionicons name="play" size={12} color={colors.textMuted} />
              <Text style={[styles.fact, { color: colors.textMuted }]}>{compactCount(engagement?.viewCount ?? 0)}</Text>
            </View>
          </View>
          {movie.genre.length > 0 && (
            <View style={styles.tags}>
              {movie.genre.map((name) => (
                <View key={name} style={[styles.tag, { backgroundColor: colors.chip }]}>
                  <Text style={[styles.tagText, { color: colors.neon }]}>{name}</Text>
                </View>
              ))}
            </View>
          )}
          {movie.description ? (
            <TouchableOpacity activeOpacity={0.8} onPress={() => setSynopsisOpen((v) => !v)} accessibilityRole="button">
              <Text style={[styles.synopsis, { color: colors.textSecondary }]} numberOfLines={synopsisOpen ? undefined : 3}>
                {movie.description}
              </Text>
              <Text style={[styles.more, { color: colors.text }]}>{synopsisOpen ? 'Thu gọn' : 'Xem thêm'}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.aiRow} onPress={() => setAiInfoOpen(true)} accessibilityRole="button">
            <MaterialCommunityIcons name="robot-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.aiText, { color: colors.textMuted }]}>Phim được tạo bằng AI</Text>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* The subtitle choice carries over to the player. */}
        <SubtitleChips
          tracks={episodes[0]?.subtitles ?? []}
          trackId={trackFor(subtitlesOn, episodes[0]?.subtitles ?? [], chosenTrack)}
          onChange={(trackId) => {
            setSubtitlesOn(trackId !== null);
            if (trackId) setChosenTrack(trackId);
          }}
        />

        {loadError ? (
          <LoadError message={loadError} onRetry={retry} />
        ) : (
          <EpisodeList episodes={episodes} isVIPMode={isVIPMode} posterUrl={movie.posterUrl} onSelect={handleSelectEpisode} />
        )}
        <RecommendationRail
          title="Phim tương tự"
          caption="AI chọn theo thể loại và quốc gia của phim này"
          movies={similar}
          onMoviePress={(m) => router.push({ pathname: '/movie/[id]', params: { id: m.id } })}
        />
      </ScrollView>

      <View style={[styles.topBar, { top: Math.max(insets.top, 10) }]} pointerEvents="box-none">
        <TouchableOpacity style={[styles.round, { backgroundColor: colors.scrim }]} onPress={() => router.back()} accessibilityLabel="Quay lại">
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.round, { backgroundColor: colors.scrim }]}
          onPress={() => void Share.share({ message: `Xem "${movie.title}" trên AI Cinema` })}
          accessibilityLabel="Chia sẻ"
        >
          <Ionicons name="share-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <LikeButton movieId={movie.id} />
        <SaveButton movieId={movie.id} />
        <Button
          label={next ? (resume ? `Xem tiếp tập ${next.episodeNumber}` : `Xem tập ${next.episodeNumber}`) : 'Chưa có tập'}
          icon={next ? 'play' : undefined}
          onPress={() => next && handleSelectEpisode(next)}
          disabled={!next}
          loading={next ? gate.checkingId === next.id : false}
          style={styles.play}
        />
      </View>

      <AIComplianceModal
        visible={aiInfoOpen}
        onClose={() => setAiInfoOpen(false)}
        aiLabel={episodes.find((ep) => ep.aiLabel)?.aiLabel}
        ageRating={movie.ageRating}
      />
      <UnlockEpisodeModal locked={gate.locked} onClose={gate.close} onUnlocked={watch} />
    </View>
  );
}
