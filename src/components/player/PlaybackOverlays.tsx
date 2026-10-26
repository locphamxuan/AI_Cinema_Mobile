import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { usePlayerClock } from '../../hooks/usePlayerClock';
import { clock } from '../../lib/vtt';
import type { AdScheduleItem } from '../../types/playback';
import { styles } from '../../styles/components/player/PlaybackOverlays.styles';

/**
 * The mid-roll ad over the paused episode (BR-33). It plays to the end; only then does "Bỏ qua quảng cáo"
 * appear to go back to the episode. An ad that fails to load hands the picture back at once.
 */
export function AdBreakOverlay({ cue, onDone }: { cue: AdScheduleItem; onDone: (watched: boolean) => void }) {
  const ad = useVideoPlayer({ uri: cue.ad.mediaUrl }, (p) => p.play());
  const { currentTime } = usePlayerClock(ad);
  const [ended, setEnded] = React.useState(false);
  const done = React.useRef(onDone);
  done.current = onDone;

  React.useEffect(() => {
    const finished = ad.addListener('playToEnd', () => setEnded(true));
    const failed = ad.addListener('statusChange', ({ status }) => status === 'error' && done.current(false));
    return () => {
      finished.remove();
      failed.remove();
    };
  }, [ad]);

  const left = Math.max(0, Math.ceil(cue.ad.durationSeconds - currentTime));
  const clickUrl = cue.ad.clickUrl;
  return (
    <View style={styles.ad} testID="ad-break">
      <VideoView style={styles.fill} player={ad} nativeControls={false} contentFit="contain" />
      <Text style={styles.adBadge}>{ended ? 'Quảng cáo đã kết thúc' : `Quảng cáo · ${clock(left)}`}</Text>
      <Text style={styles.adTitle} numberOfLines={1}>
        {cue.ad.title}
      </Text>
      <View style={styles.adActions}>
        {clickUrl ? (
          <TouchableOpacity style={styles.adLink} onPress={() => void Linking.openURL(clickUrl)} accessibilityRole="link">
            <Text style={styles.adLinkText}>Tìm hiểu thêm</Text>
          </TouchableOpacity>
        ) : null}
        {ended ? (
          <TouchableOpacity style={styles.adSkip} onPress={() => onDone(true)} accessibilityRole="button" testID="ad-skip">
            <Text style={styles.adSkipText}>Bỏ qua quảng cáo ›</Text>
          </TouchableOpacity>
        ) : null}
      </View>
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
