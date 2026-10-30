import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoPlayer } from 'expo-video';
import { cuesReached, resumePointOf } from '../lib/playback';
import { playbackService } from '../services/playbackService';
import type { AdScheduleItem, StreamingSession } from '../types/playback';

/** The BE expects a beat every 10-15s and closes a silent session, paused or not. */
const HEARTBEAT_SECONDS = 15;

/**
 * Main Flow 3 inside the player: beats while the episode plays, pauses it at each mid-roll cue
 * (and at the one a forward seek jumped over), completes the session at the end and stops it when
 * the viewer leaves. `currentTime` is the player clock the controls already read.
 */
export function usePlaybackSession(player: VideoPlayer, session: StreamingSession | undefined, currentTime: number) {
  const [activeAd, setActiveAd] = useState<AdScheduleItem | null>(null);
  const [resumeAt, setResumeAt] = useState(() => (session ? resumePointOf(session) : null));
  const handled = useRef(new Set<string>());
  const activeRef = useRef<AdScheduleItem | null>(null);
  const finished = useRef(false);
  const position = useRef(0);
  position.current = Math.floor(currentTime);
  const sessionId = session?.sessionId;

  const startAd = useCallback(
    (cue: AdScheduleItem) => {
      if (!sessionId || activeRef.current) return;
      handled.current.add(cue.breakId);
      activeRef.current = cue;
      player.pause();
      setActiveAd(cue);
      void playbackService.adStarted(sessionId, cue.breakId, position.current);
    },
    [player, sessionId],
  );

  // Heartbeat, completion at the end and stop on leave.
  useEffect(() => {
    if (!sessionId) return;
    // Counts the seconds that really played; a pause or an ad beats with 0 so it neither expires nor earns.
    let seconds = 0;
    let watched = 0;
    const tick = setInterval(() => {
      if (finished.current) return;
      if (player.playing) watched += 1;
      seconds += 1;
      if (seconds < HEARTBEAT_SECONDS) return;
      const credit = watched;
      seconds = 0;
      watched = 0;
      void playbackService.heartbeat(sessionId, position.current, credit).then((res) => {
        const due = res.data?.dueAdBreakId;
        const cue = due && !handled.current.has(due) ? session?.adSchedule.find((c) => c.breakId === due) : undefined;
        if (cue) startAd(cue);
      });
    }, 1000);
    const ended = player.addListener('playToEnd', () => {
      if (finished.current) return;
      finished.current = true;
      void playbackService.complete(sessionId, position.current);
    });
    return () => {
      clearInterval(tick);
      ended.remove();
      if (!finished.current) void playbackService.stop(sessionId, position.current);
    };
  }, [player, sessionId, session, startAd]);

  // The cue the playhead reached; a seek over several plays only the nearest one.
  useEffect(() => {
    if (!session?.adSchedule.length || activeRef.current) return;
    const due = cuesReached(session.adSchedule, currentTime, handled.current);
    if (!due) return;
    due.passed.forEach((id) => handled.current.add(id));
    startAd(due.play);
  }, [session, currentTime, startAd]);

  /** `watched` is false when the ad could not load: the episode resumes without a completed view. */
  const finishAd = useCallback(
    (watched: boolean) => {
      const cue = activeRef.current;
      if (!cue) return;
      activeRef.current = null;
      setActiveAd(null);
      if (watched && sessionId) void playbackService.adFinished(sessionId, cue.breakId);
      player.play();
    },
    [player, sessionId],
  );

  const answerResume = (resume: boolean) => {
    if (resume && resumeAt !== null) player.currentTime = resumeAt;
    setResumeAt(null);
  };

  return { activeAd, finishAd, resumeAt, answerResume };
}
