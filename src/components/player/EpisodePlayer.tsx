import React from 'react';
import { ActivityIndicator, Image, Pressable, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { usePlayerClock } from '../../hooks/usePlayerClock';
import { usePlaybackSession } from '../../hooks/usePlaybackSession';
import { useSubtitleCues } from '../../hooks/useSubtitleCues';
import { useStreamQuality } from '../../hooks/useStreamQuality';
import { usePlayerHealth } from '../../hooks/usePlayerHealth';
import { lockLandscape, lockPortrait } from '../../lib/orientation';
import { seekTarget } from '../../lib/seek';
import { cueAt } from '../../lib/vtt';
import { attachWebStream, toggleWebFullscreen, watchWebFullscreen } from '../../lib/attachWebStream';
import type { SubtitleTrack } from '../../types/movie';
import type { StreamingSession } from '../../types/playback';
import { PlayerControls } from './PlayerControls';
import { PlayerSettingsSheet } from './PlayerSettingsSheet';
import { AiLabelOverlay } from './AiLabelOverlay';
import { FullscreenStage } from './FullscreenStage';
import { AdBreakOverlay, ResumePrompt } from './PlaybackOverlays';
import { NetworkOverlay } from './NetworkOverlay';
import { styles } from '../../styles/components/player/EpisodePlayer.styles';
const HIDE_CONTROLS_MS = 3000;

interface EpisodePlayerProps {
  /** The session's stream once Main Flow 3 opened one; empty until the viewer presses play. */
  streamUrl: string;
  /** The streaming session the stream belongs to: ads, heartbeat and the resume point. */
  session?: StreamingSession;
  posterUrl: string;
  /** AI label text that stays on the picture while the video plays (BR-10). */
  aiLabel: string | null;
  checking: boolean;
  onRequestPlay: () => void;
  subtitles?: SubtitleTrack[];
  /** Null = subtitles off. */
  subtitleTrackId?: string | null;
  onSubtitleChange?: (trackId: string | null) => void;
  /** Tắt quảng cáo mid-roll khi thành viên đã có gói Tháng còn hạn (quảng cáo chỉ còn đối với chưa đăng ký gói và guest). */
  ads?: boolean;
  /** Spoken language of the film, shown in the settings. */
  audioLabel?: string;
  /** Called once the stream starts, e.g. to count a play. */
  onStarted?: () => void;
  /** Called once when the episode is seen through (85 % or its end), e.g. to show the AI suggestions after the last one. */
  onFinished?: () => void;
}

type StreamPlayerProps = Required<Omit<EpisodePlayerProps, 'posterUrl' | 'checking' | 'onRequestPlay' | 'onStarted' | 'onFinished' | 'session'>> &
  Pick<EpisodePlayerProps, 'onStarted' | 'onFinished' | 'session'>;

/** Share of an episode at which it counts as seen through, as on the BE (`recommendation-taste.ts`). */
export const FINISHED_RATIO = 0.85;

function StreamPlayer(props: StreamPlayerProps) {
  const { streamUrl, session, aiLabel, subtitles, subtitleTrackId, onSubtitleChange, audioLabel, ads, onStarted, onFinished } = props;
  const player = useVideoPlayer({ uri: streamUrl }, (p) => {
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });
  const { currentTime, duration, playing } = usePlayerClock(player);
  const playback = usePlaybackSession(player, session, currentTime, ads);
  const [quality, setQuality] = React.useState('auto');
  const stream = useStreamQuality(player, streamUrl, quality);
  const health = usePlayerHealth(player, stream.url, quality, setQuality);
  const cues = useSubtitleCues(subtitleTrackId);
  const line = subtitleTrackId ? cueAt(cues, currentTime) : null;
  const [controls, setControls] = React.useState(true);
  // When the viewer last touched the player: only that restarts the hide countdown.
  const [touchedAt, setTouchedAt] = React.useState(0);
  const [settings, setSettings] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [rate, setRate] = React.useState(1);
  const started = React.useRef(false);
  const host = React.useRef<React.ComponentRef<typeof View>>(null);

  // Seen through at 85 % (the BE's FINISHED_RATIO, credits included) or at the very end, once per stream.
  const finished = React.useRef(false);
  React.useEffect(() => {
    finished.current = false;
  }, [streamUrl]);
  const finish = React.useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onFinished?.();
  }, [onFinished]);
  React.useEffect(() => {
    const end = player.addListener('playToEnd', finish);
    return () => end.remove();
  }, [player, finish]);
  React.useEffect(() => {
    if (duration > 0 && currentTime / duration >= FINISHED_RATIO) finish();
  }, [currentTime, duration, finish]);
  React.useEffect(() => attachWebStream(host.current, stream.url), [stream.url]);
  React.useEffect(() => watchWebFullscreen(host.current, setFullscreen), []);
  React.useEffect(() => {
    if (Platform.OS === 'web') player.play();
  }, [player]);

  React.useEffect(() => {
    if (playing && !started.current) {
      started.current = true;
      onStarted?.();
    }
  }, [playing, onStarted]);

  // The controls fade away 3 s after the last touch while the video plays; a tap brings them back.
  // The clock is left out on purpose: it ticks every 250 ms and would keep restarting the countdown.
  React.useEffect(() => {
    if (!controls || !playing || settings) return;
    const timer = setTimeout(() => setControls(false), HIDE_CONTROLS_MS);
    return () => clearTimeout(timer);
  }, [controls, playing, settings, touchedAt]);

  /** A control the viewer used keeps the controls up for another full countdown. */
  const touched =
    <A extends unknown[]>(action: (...args: A) => void) =>
    (...args: A) => {
      setTouchedAt(Date.now());
      action(...args);
    };

  // Leaving the screen while fullscreen must not strand the app in landscape.
  React.useEffect(() => () => void lockPortrait(), []);

  const toggleFullscreen = () => {
    // A Modal would recreate the <video> on the web and lose its place: the browser enlarges the stage instead.
    if (Platform.OS === 'web') return toggleWebFullscreen(host.current);
    const next = !fullscreen;
    setFullscreen(next);
    void (next ? lockLandscape() : lockPortrait());
  };
  const seekTo = (seconds: number) => {
    const target = seekTarget(seconds, duration);
    if (target !== null) player.currentTime = target;
  };

  const stage = (
    <View style={styles.fill} ref={host}>
      <VideoView style={styles.fill} player={player} nativeControls={false} contentFit="contain" />
      {/* The native video surface swallows touches, so a clear layer above it takes the tap that shows or hides the controls. */}
      <Pressable
        style={styles.fill}
        onPress={touched(() => setControls((v) => !v))}
        accessibilityLabel={controls ? 'Ẩn điều khiển' : 'Hiện điều khiển'}
        testID="player-tap-layer"
      />
      {line ? (
        <View style={[styles.subtitleBox, controls && styles.subtitleRaised]} pointerEvents="none">
          <Text style={[styles.subtitle, fullscreen && styles.subtitleLarge]} testID="subtitle-line">
            {line}
          </Text>
        </View>
      ) : null}
      {controls && !playback.activeAd && (
        <PlayerControls
          currentTime={currentTime}
          duration={duration}
          playing={playing}
          fullscreen={fullscreen}
          rate={rate}
          onTogglePlay={touched(() => (playing ? player.pause() : player.play()))}
          onSeekBy={touched((s: number) => seekTo(currentTime + s))}
          onSeekTo={touched(seekTo)}
          onSettings={() => setSettings(true)}
          onToggleFullscreen={() => touched(toggleFullscreen)()}
        />
      )}
      {!playback.activeAd ? <NetworkOverlay health={health} /> : null}
      {playback.resumeAt !== null && !playback.activeAd ? (
        <ResumePrompt at={playback.resumeAt} onAnswer={playback.answerResume} />
      ) : null}
      {playback.activeAd ? <AdBreakOverlay key={playback.activeAd.breakId} cue={playback.activeAd} onDone={playback.finishAd} /> : null}
      <AiLabelOverlay text={aiLabel} />
    </View>
  );

  return (
    <FullscreenStage fullscreen={fullscreen} onExit={toggleFullscreen}>
      {stage}
      <PlayerSettingsSheet
        visible={settings}
        onClose={() => setSettings(false)}
        subtitles={subtitles}
        subtitleTrackId={subtitleTrackId}
        onSubtitleChange={onSubtitleChange}
        audioLabel={audioLabel}
        rate={rate}
        onRateChange={(r) => {
          setRate(r);
          player.playbackRate = r;
        }}
        quality={stream.options.length > 1 ? { options: stream.options, value: quality, onChange: setQuality } : undefined}
      />
    </FullscreenStage>
  );
}

export function EpisodePlayer({
  streamUrl,
  session,
  posterUrl,
  aiLabel,
  checking,
  onRequestPlay,
  subtitles = [],
  subtitleTrackId = null,
  onSubtitleChange = () => undefined,
  ads = true,
  audioLabel = 'tiếng gốc',
  onStarted,
  onFinished,
}: EpisodePlayerProps) {
  // The key makes a new episode start from its own player instead of reusing the old one.
  if (streamUrl) {
    return (
      <StreamPlayer
        key={streamUrl}
        streamUrl={streamUrl}
        session={session}
        aiLabel={aiLabel}
        subtitles={subtitles}
        subtitleTrackId={subtitleTrackId}
        onSubtitleChange={onSubtitleChange}
        audioLabel={audioLabel}
        ads={ads ?? true}
        onStarted={onStarted}
        onFinished={onFinished}
      />
    );
  }
  return (
    <View style={styles.container}>
      {posterUrl ? <Image source={{ uri: posterUrl }} style={styles.fill} resizeMode="cover" /> : null}
      <View style={styles.posterShade}>
        <TouchableOpacity style={styles.playBtn} onPress={onRequestPlay} activeOpacity={0.8} disabled={checking} accessibilityLabel="Phát tập">
          {checking ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="play" size={32} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
      <AiLabelOverlay text={aiLabel} />
    </View>
  );
}
