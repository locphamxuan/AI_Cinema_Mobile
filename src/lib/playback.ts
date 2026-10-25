import type { AdScheduleItem, StreamingSession } from '../types/playback';

/** A saved position this close to the start is not worth the resume question. */
const MIN_RESUME_SECONDS = 5;

/** UUID v4 from the platform CSPRNG when there is one: the BE refuses any other guest key shape. */
export function uuidV4(): string {
  const bytes = new Uint8Array(16);
  const cryptoApi = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * The cue to play at this position: the latest one the playhead reached and that was not handled
 * yet. A forward seek over several cues plays only the nearest one (BR-33); the earlier ones are
 * passed, as the BE marks them SKIPPED.
 */
export function cuesReached(schedule: AdScheduleItem[], position: number, handled: ReadonlySet<string>) {
  const reached = schedule.filter((c) => !handled.has(c.breakId) && c.positionSeconds <= position);
  if (reached.length === 0) return null;
  const play = reached.reduce((a, b) => (b.positionSeconds > a.positionSeconds ? b : a));
  return { play, passed: reached.map((c) => c.breakId) };
}

/** Resume point worth asking about: past the first seconds and before the credits. */
export function resumePointOf(session: Pick<StreamingSession, 'resumePositionSeconds' | 'stream'>): number | null {
  const at = session.resumePositionSeconds ?? 0;
  const duration = session.stream.durationSeconds;
  if (at < MIN_RESUME_SECONDS) return null;
  if (duration && at >= duration * 0.95) return null;
  return at;
}
