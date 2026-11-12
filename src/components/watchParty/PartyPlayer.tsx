import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePlayerClock } from '../../hooks/usePlayerClock';
import { usePlaybackSession } from '../../hooks/usePlaybackSession';
import type { StreamingSession } from '../../types/playback';
import type { RoomPlaybackState, RoomSync } from '../../types/watchRoom';
import { styles } from '../../styles/components/watchParty/PartyPlayer.styles';

/** How far a member may drift from the Host before the player jumps to the Host's position (seconds). */
const DRIFT_TOLERANCE_S = 2;

interface PartyPlayerProps {
  session: StreamingSession;
  isHost: boolean;
  sync: RoomSync | null;
  onHostAction: (state: RoomPlaybackState, positionSeconds: number) => void;
  onEnded: () => void;
}

/**
 * The shared screen of a watch room (BR-69). The Host's play / pause / seek go to the room; members follow the
 * Host's clock and only see the picture. The AI label stays on top the whole time (BR-10, mandatory).
 */
export function PartyPlayer({ session, isHost, sync, onHostAction, onEnded }: PartyPlayerProps) {
  const player = useVideoPlayer({ uri: session.stream.masterUrl }, (p) => {
    p.timeUpdateEventInterval = 0.5;
  });
  const { currentTime, playing } = usePlayerClock(player);
  usePlaybackSession(player, session, currentTime); // heartbeats keep this viewer's own streaming session alive
  useEffect(() => {
    const sub = player.addListener('playToEnd', () => onEnded());
    return () => sub.remove();
  }, [player, onEnded]);

  // Members follow the Host: jump when drifting, mirror play / pause.
  useEffect(() => {
    if (isHost || !sync) return;
    const lag = sync.state === 'PLAYING' ? (Date.now() - sync.serverTimestamp) / 1000 : 0;
    const target = sync.positionSeconds + Math.max(0, lag);
    if (Math.abs(player.currentTime - target) > DRIFT_TOLERANCE_S) player.currentTime = target;
    if (sync.state === 'PLAYING') player.play();
    else player.pause();
  }, [sync, isHost, player]);

  const host = (state: RoomPlaybackState, at = player.currentTime) => {
    if (state === 'PLAYING') player.play();
    else player.pause();
    onHostAction(state, at);
  };
  const seek = (delta: number) => {
    const at = Math.max(0, player.currentTime + delta);
    player.currentTime = at;
    onHostAction(playing ? 'PLAYING' : 'PAUSED', at);
  };

  return (
    <View style={styles.frame}>
      <VideoView player={player} style={styles.video} nativeControls={false} contentFit="contain" />
      <View style={styles.aiBadge} pointerEvents="none" testID="ai-label-overlay">
        <MaterialCommunityIcons name="robot-outline" size={12} color="#FF3D7F" />
        <Text style={styles.aiBadgeText} numberOfLines={1}>
          {session.aiLabel?.text || 'Nội dung do AI tạo'}
        </Text>
      </View>
      {isHost ? (
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => seek(-10)} accessibilityLabel="Lùi 10 giây">
            <Ionicons name="play-back" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => host(playing ? 'PAUSED' : 'PLAYING')} accessibilityLabel={playing ? 'Tạm dừng' : 'Phát'}>
            <Ionicons name={playing ? 'pause-circle' : 'play-circle'} size={52} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seek(10)} accessibilityLabel="Tua 10 giây">
            <Ionicons name="play-forward" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.followHint}>Đang xem theo chủ phòng</Text>
      )}
    </View>
  );
}
