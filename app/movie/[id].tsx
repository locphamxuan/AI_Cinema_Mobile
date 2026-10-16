import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Share, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { useEpisodeGate } from '../../src/hooks/useEpisodeGate';
import { movieService } from '../../src/services';
import { Movie, Episode } from '../../src/types/movie';
import { AIComplianceModal } from '../../src/components/player/AIComplianceModal';
import { UnlockEpisodeModal } from '../../src/components/player/UnlockEpisodeModal';
import { AudioModeTabs, trackFor, type AudioMode } from '../../src/components/movie/AudioModeTabs';
import { EpisodeList } from '../../src/components/movie/EpisodeList';
import { LikeButton, compactCount, useMovieEngagement } from '../../src/components/movie/LikeButton';
import { Button } from '../../src/components/common/Button';
import { fonts, textStyle, useTheme } from '../../src/theme';

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { currentMovie, setCurrentMovie, movies, myList, toggleMyList, isVIPMode, watchHistory } = useAppStore();

  const foundMovie = movies.find((item) => item.id === id) || (currentMovie?.id === id ? currentMovie : null);

  const [movie, setMovie] = useState<Movie | null>(foundMovie);
  const [loading, setLoading] = useState(!foundMovie);
  const [audioMode, setAudioMode] = useState<AudioMode>('subtitle');
  const [chosenTrack, setChosenTrack] = useState<string | null>(null);
  const [synopsisOpen, setSynopsisOpen] = useState(false);
  const [aiInfoOpen, setAiInfoOpen] = useState(false);
  const [engagement] = useMovieEngagement(id);

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

  if (loading || !movie) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.ruby} />
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

  // "Xem tiếp" picks up the last episode opened on this device; otherwise the first one.
  const lastSeen = watchHistory.find((item) => item.movieId === movie.id);
  const resume = lastSeen ? episodes.find((ep) => ep.id === lastSeen.episodeId) : undefined;
  const next = resume ?? episodes[0];
  const saved = myList.includes(movie.id);
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
        <TouchableOpacity
          style={[styles.save, { backgroundColor: colors.cardAlt }]}
          onPress={() => toggleMyList(movie.id)}
          accessibilityLabel={saved ? 'Bỏ lưu phim' : 'Lưu phim'}
          accessibilityState={{ selected: saved }}
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? colors.ruby : colors.text} />
        </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 32, gap: 8 },
  missingTitle: { ...textStyle.title },
  missingText: { ...textStyle.label, textAlign: 'center' },
  missingBtn: { marginTop: 12, alignSelf: 'center' },
  head: { paddingHorizontal: 16, marginTop: -72, gap: 12 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 36, lineHeight: 40 },
  facts: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  fact: { ...textStyle.labelStrong },
  age: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  ageText: { ...textStyle.captionStrong },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { ...textStyle.captionStrong },
  synopsis: { ...textStyle.body, fontSize: 14, lineHeight: 22 },
  more: { ...textStyle.labelStrong, marginTop: 4 },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  aiText: { ...textStyle.label },
  topBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  save: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  play: { flex: 1 },
});
