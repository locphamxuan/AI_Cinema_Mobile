import React from 'react';
import { ActivityIndicator, Image, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { usePlayerClock } from '../../hooks/usePlayerClock';
import { usePlaybackSession } from '../../hooks/usePlaybackSession';
import { useSubtitleCues } from '../../hooks/useSubtitleCues';
import { lockLandscape, lockPortrait } from '../../lib/orientation';
import { seekTarget } from '../../lib/seek';
import { cueAt } from '../../lib/vtt';
import type { SubtitleTrack } from '../../types/movie';
import type { StreamingSession } from '../../types/playback';
import { PlayerControls } from './PlayerControls';
import { PlayerSettingsSheet } from './PlayerSettingsSheet';
import { DEFAULT_AI_LABEL } from './AIComplianceModal';
import { AdBreakOverlay, ResumePrompt } from './PlaybackOverlays';
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
  /** Null = subtitles off (Thuyết minh: the film's own audio only). */
  subtitleTrackId?: string | null;
  onSubtitleChange?: (trackId: string | null) => void;
  /** Spoken language of the film, shown in the settings. */
  audioLabel?: string;
  /** Called once the stream starts, e.g. to count a play. */
  onStarted?: () => void;
}

/** The AI label sits over the poster, the playing video and fullscreen; it is never hidden. */
function AiLabelOverlay({ text }: { text: string | null }) {
  return (
    <View style={styles.aiBadge} pointerEvents="none" testID="ai-label-overlay">
      <MaterialCommunityIcons name="robot-outline" size={12} color="#FF3D7F" />
      <Text style={styles.aiBadgeText} numberOfLines={1}>
        {text || DEFAULT_AI_LABEL}
      </Text>
    </View>
  );
}

type StreamPlayerProps = Required<Omit<EpisodePlayerProps, 'posterUrl' | 'checking' | 'onRequestPlay' | 'onStarted' | 'session'>> &
  Pick<EpisodePlayerProps, 'onStarted' | 'session'>;

function StreamPlayer(props: StreamPlayerProps) {
  const { streamUrl, session, aiLabel, subtitles, subtitleTrackId, onSubtitleChange, audioLabel, onStarted } = props;
  const player = useVideoPlayer({ uri: streamUrl }, (p) => {
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });
  const { currentTime, duration, playing } = usePlayerClock(player);
  const playback = usePlaybackSession(player, session, currentTime);
  const cues = useSubtitleCues(subtitleTrackId);
  const line = subtitleTrackId ? cueAt(cues, currentTime) : null;
  const [controls, setControls] = React.useState(true);
  // When the viewer last touched the player: only that restarts the hide countdown.
  const [touchedAt, setTouchedAt] = React.useState(0);
  const [settings, setSettings] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [rate, setRate] = React.useState(1);
  const started = React.useRef(false);

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
    const next = !fullscreen;
    setFullscreen(next);
    void (next ? lockLandscape() : lockPortrait());
  };
  const seekTo = (seconds: number) => {
    const target = seekTarget(seconds, duration);
    if (target !== null) player.currentTime = target;
  };

  const stage = (
    <Pressable style={styles.fill} onPress={touched(() => setControls((v) => !v))} accessibilityLabel="Hiện điều khiển">
      <VideoView style={styles.fill} player={player} nativeControls={false} contentFit="contain" />
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
          onToggleFullscreen={touched(toggleFullscreen)}
        />
      )}
      {playback.resumeAt !== null && !playback.activeAd ? (
        <ResumePrompt at={playback.resumeAt} onAnswer={playback.answerResume} />
      ) : null}
      {playback.activeAd ? <AdBreakOverlay key={playback.activeAd.breakId} cue={playback.activeAd} onDone={playback.finishAd} /> : null}
      <AiLabelOverlay text={aiLabel} />
    </Pressable>
  );

  return (
    <>
      {fullscreen ? (
        <Modal visible animationType="fade" supportedOrientations={['landscape', 'portrait']} onRequestClose={toggleFullscreen}>
          <View style={styles.fullscreen}>{stage}</View>
        </Modal>
      ) : (
        stage
      )}
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
      />
    </>
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
  audioLabel = 'tiếng gốc',
  onStarted,
}: EpisodePlayerProps) {
  return (
    <View style={styles.container}>
      {streamUrl ? (
        // The key makes a new episode start from its own player instead of reusing the old one.
        <StreamPlayer
          key={streamUrl}
          streamUrl={streamUrl}
          session={session}
          aiLabel={aiLabel}
          subtitles={subtitles}
          subtitleTrackId={subtitleTrackId}
          onSubtitleChange={onSubtitleChange}
          audioLabel={audioLabel}
          onStarted={onStarted}
        />
      ) : (
        <>
          {posterUrl ? <Image source={{ uri: posterUrl }} style={styles.fill} resizeMode="cover" /> : null}
          <View style={styles.posterShade}>
            <TouchableOpacity style={styles.playBtn} onPress={onRequestPlay} activeOpacity={0.8} disabled={checking} accessibilityLabel="Phát tập">
              {checking ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="play" size={32} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
          <AiLabelOverlay text={aiLabel} />
        </>
      )}
    </View>
  );
}
