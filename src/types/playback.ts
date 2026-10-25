/**
 * Main Flow 3 - Playback & Viewing Experience. Mirrors the BE responses of
 * src/modules/playback one-to-one; field names are the BE ones.
 */

/** How the playback access was granted (MF-2 handoff access_type). */
export type PlaybackAccessType = 'FREE_STARTER' | 'SUBSCRIPTION' | 'COIN_UNLOCK' | 'ADMIN_GRANT';

/** One mid-roll cue of the session and the ad shown when the playhead gets there. */
export interface AdScheduleItem {
  breakId: string;
  positionSeconds: number;
  ad: { id: string; title: string; mediaUrl: string; clickUrl: string | null; durationSeconds: number };
}

/** POST /playback/sessions */
export interface StreamingSession {
  sessionId: string;
  episodeId: string;
  movieId: string;
  accessType: PlaybackAccessType;
  planCode?: string | null;
  status: string;
  /** Signed token playlist filtered by the plan ceiling, or the origin URL when signing is off. */
  stream: { masterUrl: string; qualities: string[]; durationSeconds: number | null };
  aiLabel: { type: string; text: string; displayLocation: string | null } | null;
  /** Saved position for the resume-or-restart question; absent when none. */
  resumePositionSeconds?: number;
  adSchedule: AdScheduleItem[];
  reused?: boolean;
}

/** Heartbeat, stop and complete answer the session state. */
export interface SessionState {
  sessionId: string;
  status: string;
  positionSeconds: number;
  completed: boolean;
  /** Heartbeat only: the break the playhead passed without playing it; the player plays it now. */
  dueAdBreakId: string | null;
}
