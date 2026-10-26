import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { usePlayerClock } from '../../hooks/usePlayerClock';
import { clock } from '../../lib/vtt';
import type { AdScheduleItem } from '../../types/playback';
import { styles } from '../../styles/components/player/PlaybackOverlays.styles';

/**
 * The mid-roll ad over the paused episode. It cannot be skipped (BR-33); it ends by itself and an ad
 * that fails to load hands the picture back at once instead of blocking the episode.
 */
export function AdBreakOverlay({ cue, onDone }: { cue: AdScheduleItem; onDone: (watched: boolean) => void }) {
  const ad = useVideoPlayer({ uri: cue.ad.mediaUrl }, (p) => p.play());
  const { currentTime } = usePlayerClock(ad);
  const done = React.useRef(onDone);
  done.current = onDone;

  React.useEffect(() => {
    const ended = ad.addListener('playToEnd', () => done.current(true));
    const failed = ad.addListener('statusChange', ({ status }) => status === 'error' && done.current(false));
    return () => {
      ended.remove();
      failed.remove();
    };
  }, [ad]);

  const left = Math.max(0, Math.ceil(cue.ad.durationSeconds - currentTime));
  const clickUrl = cue.ad.clickUrl;
  return (
    <View style={styles.ad} testID="ad-break">
      <VideoView style={styles.fill} player={ad} nativeControls={false} contentFit="contain" />
      <Text style={styles.adBadge}>Quảng cáo · {clock(left)}</Text>
      <Text style={styles.adTitle} numberOfLines={1}>
        {cue.ad.title}
      </Text>
      {clickUrl ? (
        <TouchableOpacity style={styles.adLink} onPress={() => void Linking.openURL(clickUrl)} accessibilityRole="link">
          <Text style={styles.adLinkText}>Tìm hiểu thêm</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/** Resume-or-restart question (flow 3, step 9) for a member who stopped part-way. */
export function ResumePrompt({ at, onAnswer }: { at: number; onAnswer: (resume: boolean) => void }) {
  return (
    <View style={styles.resume}>
      <Text style={styles.resumeText}>Bạn đã xem tới {clock(at)}</Text>
      <TouchableOpacity style={styles.resumeMain} onPress={() => onAnswer(true)} accessibilityRole="button">
        <Text style={styles.resumeMainText}>Xem tiếp</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.resumeAlt} onPress={() => onAnswer(false)} accessibilityRole="button">
        <Text style={styles.resumeText}>Xem từ đầu</Text>
      </TouchableOpacity>
    </View>
  );
}
