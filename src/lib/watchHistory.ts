import type { Episode } from '../types/movie';
import type { WatchHistoryEntry } from '../types/playback';
import { clock } from './vtt';

/** The member's last opened episode of each film, newest first; the BE sends one row per episode. */
export function latestPerMovie(history: WatchHistoryEntry[]): WatchHistoryEntry[] {
  const seen = new Set<string>();
  return history.filter((row) => {
    if (seen.has(row.movieId)) return false;
    seen.add(row.movieId);
    return true;
  });
}

/**
 * Where "Xem tiếp" picks up in a film: the newest episode the member opened, or the one after it
 * once that one is finished. Undefined when the member has no usable progress in the film.
 */
export function resumeEpisode(history: WatchHistoryEntry[], movieId: string, episodes: Episode[]): Episode | undefined {
  const last = history.find((row) => row.movieId === movieId && row.available);
  if (!last) return undefined;
  const index = episodes.findIndex((ep) => ep.id === last.episodeId);
  if (index < 0) return undefined;
  return last.completed && episodes[index + 1] ? episodes[index + 1] : episodes[index];
}

/**
 * Where the member stopped in an episode: "Tập 3 · 12:34 / 45:00" and how far along (0–1) for the bar.
 * A finished episode reads "Đã xem hết"; an unknown length shows the position only.
 */
export function watchProgress(row: Pick<WatchHistoryEntry, 'episodeNumber' | 'positionSeconds' | 'durationSeconds' | 'completed'>): {
  label: string;
  ratio: number;
} {
  const episode = `Tập ${row.episodeNumber}`;
  if (row.completed) return { label: `${episode} · Đã xem hết`, ratio: 1 };
  const duration = row.durationSeconds && row.durationSeconds > 0 ? row.durationSeconds : null;
  const at = clock(row.positionSeconds);
  return duration
    ? { label: `${episode} · ${at} / ${clock(duration)}`, ratio: Math.min(1, Math.max(0, row.positionSeconds / duration)) }
    : { label: `${episode} · đang ở ${at}`, ratio: 0 };
}
