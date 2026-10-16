import React from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { usePlayerClock } from '../../hooks/usePlayerClock';
import { useSubtitleCues } from '../../hooks/useSubtitleCues';
import { lockLandscape, lockPortrait } from '../../lib/orientation';
import { seekTarget } from '../../lib/seek';
import { cueAt } from '../../lib/vtt';
import type { SubtitleTrack } from '../../types/movie';
import { PlayerControls } from './PlayerControls';
import { PlayerSettingsSheet } from './PlayerSettingsSheet';

const DEFAULT_AI_LABEL = 'Nội dung được tạo bởi AI';
const HIDE_CONTROLS_MS = 3000;

interface EpisodePlayerProps {
  /** What the BE handed over once access was granted; empty until the viewer presses play. */
  streamUrl: string;
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
      <MaterialCommunityIcons name="robot-outline" size={12} color="#10B981" />
      <Text style={styles.aiBadgeText} numberOfLines={1}>
        {text || DEFAULT_AI_LABEL}
      </Text>
    </View>
  );
}

function StreamPlayer(props: Required<Omit<EpisodePlayerProps, 'posterUrl' | 'checking' | 'onRequestPlay' | 'onStarted'>> & { onStarted?: () => void }) {
  const { streamUrl, aiLabel, subtitles, subtitleTrackId, onSubtitleChange, audioLabel, onStarted } = props;
  const player = useVideoPlayer({ uri: streamUrl }, (p) => {
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });
  const { currentTime, duration, playing } = usePlayerClock(player);
  const cues = useSubtitleCues(subtitleTrackId);
  const line = subtitleTrackId ? cueAt(cues, currentTime) : null;
  const [controls, setControls] = React.useState(true);
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

  // The controls fade away while the video plays; a tap brings them back.
  React.useEffect(() => {
    if (!controls || !playing || settings) return;
    const timer = setTimeout(() => setControls(false), HIDE_CONTROLS_MS);
    return () => clearTimeout(timer);
  }, [controls, playing, settings, currentTime]);

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
    <Pressable style={styles.fill} onPress={() => setControls((v) => !v)} accessibilityLabel="Hiện điều khiển">
      <VideoView style={styles.fill} player={player} nativeControls={false} contentFit="contain" />
      {line ? (
        <View style={[styles.subtitleBox, controls && styles.subtitleRaised]} pointerEvents="none">
          <Text style={[styles.subtitle, fullscreen && styles.subtitleLarge]} testID="subtitle-line">
            {line}
          </Text>
        </View>
      ) : null}
      {controls && (
        <PlayerControls
          currentTime={currentTime}
          duration={duration}
          playing={playing}
          fullscreen={fullscreen}
          rate={rate}
          onTogglePlay={() => (playing ? player.pause() : player.play())}
          onSeekBy={(s) => seekTo(currentTime + s)}
          onSeekTo={seekTo}
          onSettings={() => setSettings(true)}
          onToggleFullscreen={toggleFullscreen}
        />
      )}
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

const styles = StyleSheet.create({
  container: { width: '100%', height: 220, backgroundColor: '#000000' },
  fill: { width: '100%', height: '100%', position: 'absolute' },
  fullscreen: { flex: 1, backgroundColor: '#000000' },
  posterShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleBox: { position: 'absolute', left: 12, right: 12, bottom: 10, alignItems: 'center' },
  subtitleRaised: { bottom: 40 },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  subtitleLarge: { fontSize: 20 },
  aiBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    maxWidth: '70%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  aiBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});
