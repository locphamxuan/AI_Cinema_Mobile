import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { usePlayerClock } from '../../hooks/usePlayerClock';
import { adSecondsLeft } from '../../lib/playback';
import { clock } from '../../lib/vtt';
import type { AdScheduleItem } from '../../types/playback';
import { styles } from '../../styles/components/player/PlaybackOverlays.styles';

/**
 * The mid-roll ad over the paused episode (BR-33). It plays to the end: "Bỏ qua quảng cáo" counts down
 * and only takes a tap once the ad is over. An ad that fails to load hands the picture back at once.
 */
export function AdBreakOverlay({ cue, onDone }: { cue: AdScheduleItem; onDone: (watched: boolean) => void }) {
  const ad = useVideoPlayer({ uri: cue.ad.mediaUrl }, (p) => p.play());
  const { currentTime, duration } = usePlayerClock(ad);
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

  const left = adSecondsLeft(currentTime, duration, cue.ad.durationSeconds, ended);
  const over = left === 0;
  const clickUrl = cue.ad.clickUrl;
  return (
    <View style={styles.ad} testID="ad-break">
      <VideoView style={styles.fill} player={ad} nativeControls={false} contentFit="contain" />
      <Text style={styles.adBadge}>{over ? 'Quảng cáo đã kết thúc' : `Quảng cáo · ${clock(left)}`}</Text>
      <Text style={styles.adTitle} numberOfLines={1}>
        {cue.ad.title}
      </Text>
      <View style={styles.adActions}>
        {clickUrl ? (
          <TouchableOpacity style={styles.adLink} onPress={() => void Linking.openURL(clickUrl)} accessibilityRole="link">
            <Text style={styles.adLinkText}>Tìm hiểu thêm</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.adSkip, !over && styles.adSkipWaiting]}
          onPress={() => onDone(true)}
          disabled={!over}
          accessibilityRole="button"
          accessibilityState={{ disabled: !over }}
          testID="ad-skip"
        >
          <Text style={[styles.adSkipText, !over && styles.adSkipTextWaiting]}>
            {over ? 'Bỏ qua quảng cáo ›' : `Bỏ qua sau ${left}s`}
          </Text>
        </TouchableOpacity>
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
