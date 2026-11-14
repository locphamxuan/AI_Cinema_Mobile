import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { usePlayerClock } from '../../hooks/usePlayerClock';
import { clock } from '../../lib/vtt';
import type { RoomAdState } from '../../types/watchRoom';
import { styles } from '../../styles/components/player/PlaybackOverlays.styles';

const AUTOPLAY_GRACE_MS = 1500;

/**
 * A watch-room member's view of the Host's mid-roll (BR-69, 13/11/2026): the same ad, from where the Host
 * is in it, with no skip button — the room resumes when the Host skips. A member never gets an ad of
 * their own inside a room.
 */
export function RoomAdOverlay({ ad }: { ad: RoomAdState }) {
  // A member who joins mid-ad starts where the Host is in it.
  const player = useVideoPlayer(ad.mediaUrl ? { uri: ad.mediaUrl } : null, (p) => {
    p.currentTime = ad.startedAt ? Math.max(0, (Date.now() - ad.startedAt) / 1000) : 0;
    p.play();
  });
  const { currentTime, duration, playing } = usePlayerClock(player);
  const [graceOver, setGraceOver] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setGraceOver(true), AUTOPLAY_GRACE_MS);
    return () => clearTimeout(timer);
  }, []);
  const length = ad.durationSeconds || duration;
  const left = Math.max(0, Math.ceil(length - currentTime));

  return (
    <View style={styles.ad} testID="room-ad">
      {ad.mediaUrl ? <VideoView style={styles.fill} player={player} nativeControls={false} contentFit="contain" /> : null}
      {ad.mediaUrl && graceOver && !playing && left > 0 ? (
        <TouchableOpacity style={styles.adPlay} onPress={() => player.play()} accessibilityLabel="Phát quảng cáo">
          <Ionicons name="play" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}
      <Text style={styles.adBadge}>{left > 0 ? `Quảng cáo · ${clock(left)}` : 'Quảng cáo đã kết thúc'}</Text>
      {ad.title ? (
        <Text style={styles.adTitle} numberOfLines={1}>
          {ad.title}
        </Text>
      ) : null}
      <View style={styles.adActions}>
        <View style={[styles.adSkip, styles.adSkipWaiting]}>
          <Text style={[styles.adSkipText, styles.adSkipTextWaiting]}>Chờ chủ phòng bỏ qua quảng cáo</Text>
        </View>
      </View>
    </View>
  );
}
