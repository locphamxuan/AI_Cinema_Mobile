import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { usePlayerClock } from '../../hooks/usePlayerClock';
import { usePlaybackSession } from '../../hooks/usePlaybackSession';
import { useSubtitleCues } from '../../hooks/useSubtitleCues';
import { attachWebStream, toggleWebFullscreen, watchWebFullscreen } from '../../lib/attachWebStream';
import { lockLandscape, lockPortrait } from '../../lib/orientation';
import { seekTarget } from '../../lib/seek';
import { cueAt } from '../../lib/vtt';
import type { SubtitleTrack } from '../../types/movie';
import type { StreamingSession } from '../../types/playback';
import type { RoomPlaybackState, RoomSync } from '../../types/watchRoom';
import { PlayerControls } from '../player/PlayerControls';
import { PlayerSettingsSheet } from '../player/PlayerSettingsSheet';
import { AdBreakOverlay } from '../player/PlaybackOverlays';
import { styles } from '../../styles/components/player/EpisodePlayer.styles';
import { styles as party } from '../../styles/components/watchParty/PartyPlayer.styles';

/** How far a member may drift from the Host before jumping to the Host's position (seconds). */
const DRIFT_TOLERANCE_S = 2;
const HIDE_CONTROLS_MS = 3000;

interface PartyPlayerProps {
  session: StreamingSession;
  isHost: boolean;
  sync: RoomSync | null;
  subtitles: SubtitleTrack[];
  audioLabel: string;
  onHostAction: (state: RoomPlaybackState, positionSeconds: number) => void;
  onEnded: () => void;
}

/**
 * The shared screen of a watch room (BR-69). The Host gets the full controls (play, ±10 s, seek bar, fullscreen) and
 * every action reaches the room; members follow the Host's clock and pick their own subtitles. The stream is HLS
 * with adaptive quality (the best the connection allows), on the web through the same hls.js stage as the normal
 * player. The AI label stays on top the whole time (BR-10, mandatory).
 */
export function PartyPlayer({ session, isHost, sync, subtitles, audioLabel, onHostAction, onEnded }: PartyPlayerProps) {
  const player = useVideoPlayer({ uri: session.stream.masterUrl }, (p) => {
    p.timeUpdateEventInterval = 0.25;
  });
  const { currentTime, duration, playing } = usePlayerClock(player);
  // Heartbeats keep this viewer's own streaming session alive; it also schedules the Admin's mid-roll ads for a
  // viewer without the Monthly plan (BR-32), exactly as outside a room.
  const playback = usePlaybackSession(player, session, currentTime);
  const adShown = useRef(false);
  const host = useRef<React.ComponentRef<typeof View>>(null);
  const [controls, setControls] = useState(true);
  const [touchedAt, setTouchedAt] = useState(0);
  const [settings, setSettings] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [trackId, setTrackId] = useState<string | null>(null);
  const cues = useSubtitleCues(trackId);
  const line = trackId ? cueAt(cues, currentTime) : null;

  useEffect(() => attachWebStream(host.current, session.stream.masterUrl), [session.stream.masterUrl]);
  useEffect(() => watchWebFullscreen(host.current, setFullscreen), []);
  useEffect(() => () => void lockPortrait(), []);
  useEffect(() => {
    const sub = player.addListener('playToEnd', () => onEnded());
    return () => sub.remove();
  }, [player, onEnded]);

  // A room never asks where to resume: everyone starts where the Host is.
  useEffect(() => {
    if (playback.resumeAt !== null) playback.answerResume(false);
  }, [playback]);

  // Mid-roll ad of the Host: the whole room waits (PAUSED) until the Host's ad is over, then plays on.
  useEffect(() => {
    if (!isHost) return;
    if (playback.activeAd && !adShown.current) {
      adShown.current = true;
      onHostAction('PAUSED', player.currentTime);
    } else if (!playback.activeAd && adShown.current) {
      adShown.current = false;
      onHostAction('PLAYING', player.currentTime);
    }
  }, [isHost, playback.activeAd, onHostAction, player]);

  // Members follow the Host: jump when drifting, mirror play / pause. During a member's own ad the room keeps going;
  // once it ends the member catches up with the Host.
  useEffect(() => {
    if (isHost || !sync || playback.activeAd) return;
    const lag = sync.state === 'PLAYING' ? (Date.now() - sync.serverTimestamp) / 1000 : 0;
    const target = sync.positionSeconds + Math.max(0, lag);
    if (Math.abs(player.currentTime - target) > DRIFT_TOLERANCE_S) player.currentTime = target;
    if (sync.state === 'PLAYING') player.play();
    else player.pause();
  }, [sync, isHost, player, playback.activeAd]);

  useEffect(() => {
    if (!controls || !playing || settings) return;
    const timer = setTimeout(() => setControls(false), HIDE_CONTROLS_MS);
    return () => clearTimeout(timer);
  }, [controls, playing, settings, touchedAt]);

  const touched =
    <A extends unknown[]>(action: (...args: A) => void) =>
    (...args: A) => {
      setTouchedAt(Date.now());
      action(...args);
    };
  const seekTo = (seconds: number) => {
    const target = seekTarget(seconds, duration);
    if (target === null) return;
    player.currentTime = target;
    onHostAction(playing ? 'PLAYING' : 'PAUSED', target);
  };
  const togglePlay = () => {
    if (playing) player.pause();
    else player.play();
    onHostAction(playing ? 'PAUSED' : 'PLAYING', player.currentTime);
  };
  const toggleFullscreen = () => {
    if (Platform.OS === 'web') return toggleWebFullscreen(host.current);
    const next = !fullscreen;
    setFullscreen(next);
    void (next ? lockLandscape() : lockPortrait());
  };

  return (
    <View style={styles.container}>
      <View style={styles.fill} ref={host}>
        <VideoView style={styles.fill} player={player} nativeControls={false} contentFit="contain" />
        <Pressable
          style={styles.fill}
          onPress={touched(() => setControls((v) => !v))}
          accessibilityLabel={controls ? 'Ẩn điều khiển' : 'Hiện điều khiển'}
        />
        {line ? (
          <View style={[styles.subtitleBox, controls && styles.subtitleRaised]} pointerEvents="none">
            <Text style={styles.subtitle}>{line}</Text>
          </View>
        ) : null}
        <View style={styles.aiBadge} pointerEvents="none" testID="ai-label-overlay">
          <MaterialCommunityIcons name="robot-outline" size={12} color="#FF3D7F" />
          <Text style={styles.aiBadgeText} numberOfLines={1}>
            {session.aiLabel?.text || 'Phim được tạo bằng trí tuệ nhân tạo (AI)'}
          </Text>
        </View>
        {controls && isHost && !playback.activeAd ? (
          <PlayerControls
            currentTime={currentTime}
            duration={duration}
            playing={playing}
            fullscreen={fullscreen}
            rate={1}
            onTogglePlay={touched(togglePlay)}
            onSeekBy={touched((s: number) => seekTo(currentTime + s))}
            onSeekTo={touched(seekTo)}
            onSettings={() => setSettings(true)}
            onToggleFullscreen={() => touched(toggleFullscreen)()}
          />
        ) : null}
        {controls && !isHost && !playback.activeAd ? (
          <View style={party.memberBar}>
            <View style={party.followPill}>
              <Ionicons name="people" size={13} color="#fff" />
              <Text style={party.followText}>Đang xem theo chủ phòng</Text>
            </View>
            <View style={party.memberActions}>
              <TouchableOpacity onPress={() => setSettings(true)} accessibilityLabel="Phụ đề" hitSlop={8}>
                <Ionicons name="settings-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleFullscreen} accessibilityLabel="Toàn màn hình" hitSlop={8}>
                <Ionicons name={fullscreen ? 'contract' : 'expand'} size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        {playback.activeAd ? (
          <AdBreakOverlay key={playback.activeAd.breakId} cue={playback.activeAd} onDone={playback.finishAd} />
        ) : null}
      </View>
      <PlayerSettingsSheet
        visible={settings}
        onClose={() => setSettings(false)}
        subtitles={subtitles}
        subtitleTrackId={trackId}
        onSubtitleChange={setTrackId}
        audioLabel={audioLabel}
        rate={1}
        // Everyone in the room plays at 1×: a different speed would drift from the Host.
        onRateChange={() => undefined}
      />
    </View>
  );
}
