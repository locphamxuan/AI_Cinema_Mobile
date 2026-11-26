import React from 'react';
import { AppState, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { usePlayerClock } from '../../hooks/usePlayerClock';
import { adSecondsLeft } from '../../lib/playback';
import { onLivePlayer } from '../../lib/playerSafe';
import { clock } from '../../lib/vtt';
import type { AdScheduleItem } from '../../types/playback';
import { styles } from '../../styles/components/player/PlaybackOverlays.styles';

/** How long an ad may sit still at the start before the member is offered a play button. */
const AUTOPLAY_GRACE_MS = 1500;
/** An ad video that is still not ready after this long is skipped: it must never hold the episode. */
export const AD_LOAD_TIMEOUT_MS = 10000;

interface AdBreakOverlayProps {
  cue: AdScheduleItem;
  /** The ad played to its end (once): the completed view is recorded. */
  onEnded: () => void;
  /** Back to the episode: the viewer pressed "Bỏ qua quảng cáo", or the ad could not be played. */
  onDone: () => void;
}

/**
 * The mid-roll ad over the paused episode (BR-33). It plays to the end with no way to seek or skip; only then does
 * "Bỏ qua quảng cáo" appear, and the episode goes on from where it paused. An ad that fails or never loads is
 * logged and skipped at once. Coming back to the app, the ad goes on from where it stopped.
 */
export function AdBreakOverlay({ cue, onEnded, onDone }: AdBreakOverlayProps) {
  const ad = useVideoPlayer({ uri: cue.ad.mediaUrl }, (p) => p.play());
  const { currentTime, duration, playing } = usePlayerClock(ad);
  const [ended, setEnded] = React.useState(false);
  const [ready, setReady] = React.useState(() => ad.status === 'readyToPlay');
  const latest = React.useRef({ onEnded, onDone });
  React.useEffect(() => {
    latest.current = { onEnded, onDone };
  }, [onEnded, onDone]);

  const fail = React.useCallback(
    (why: string) => {
      console.warn(`Bỏ qua quảng cáo ${cue.ad.id} (${cue.breakId}): ${why}`);
      latest.current.onDone();
    },
    [cue.ad.id, cue.breakId],
  );

  React.useEffect(() => {
    const finished = ad.addListener('playToEnd', () => setEnded(true));
    const status = ad.addListener('statusChange', ({ status: next, error }) => {
      if (next === 'readyToPlay') setReady(true);
      if (next === 'error') fail(error?.message ?? 'video lỗi');
    });
    return () => {
      finished.remove();
      status.remove();
    };
  }, [ad, fail]);

  // `playing` only says the player wants to play; a loaded file or a moving clock says the video is really there.
  const started = ready || currentTime > 0;
  React.useEffect(() => {
    if (started) return;
    const timer = setTimeout(() => fail('video không tải được'), AD_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [started, fail]);

  const left = adSecondsLeft(currentTime, duration, cue.ad.durationSeconds, ended);
  const over = left === 0;
  const reported = React.useRef(false);
  React.useEffect(() => {
    if (!over || reported.current) return;
    reported.current = true;
    latest.current.onEnded();
  }, [over]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !reported.current) onLivePlayer(() => ad.play());
    });
    return () => sub.remove();
  }, [ad]);

  // A browser blocks an ad with sound from starting on its own: the member starts it with one tap.
  const [graceOver, setGraceOver] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setGraceOver(true), AUTOPLAY_GRACE_MS);
    return () => clearTimeout(timer);
  }, []);
  const blocked = graceOver && !playing && !over;
  return (
    <View style={styles.ad} testID="ad-break">
      <VideoView style={styles.fill} player={ad} nativeControls={false} contentFit="contain" />
      {blocked ? (
        <TouchableOpacity style={styles.adPlay} onPress={() => ad.play()} accessibilityLabel="Phát quảng cáo" testID="ad-play">
          <Ionicons name="play" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}
      <Text style={styles.adBadge}>{over ? 'Quảng cáo đã kết thúc' : `Quảng cáo · ${clock(left)}`}</Text>
      <Text style={styles.adTitle} numberOfLines={1}>
        {cue.ad.title}
      </Text>
      {over ? (
        <View style={styles.adActions}>
          <TouchableOpacity style={styles.adSkip} onPress={onDone} accessibilityRole="button" testID="ad-skip">
            <Text style={styles.adSkipText}>Bỏ qua quảng cáo ›</Text>
          </TouchableOpacity>
        </View>
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
