import type { Episode, Movie } from '../types/movie';
import { VN_DAY_LABELS, getTodayDayIndex } from '../utils/date';

export const RELEASE_WINDOW_DAYS = 7;

export interface ReleaseDay {
  /** Local calendar day, YYYY-MM-DD. */
  key: string;
  /** "Hôm nay", "Hôm qua", then T2…CN. */
  label: string;
  /** "16/10". */
  date: string;
}

export interface Release {
  movie: Movie;
  episode: Episode;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** The device's calendar day of a moment, so "today" matches what the viewer sees on the clock. */
export function dayKey(moment: Date): string {
  return `${moment.getFullYear()}-${pad(moment.getMonth() + 1)}-${pad(moment.getDate())}`;
}

/** Today and the days before it, newest first. */
export function recentDays(today: Date, count = RELEASE_WINDOW_DAYS): ReleaseDay[] {
  return Array.from({ length: count }, (_, i) => {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const label = i === 0 ? 'Hôm nay' : i === 1 ? 'Hôm qua' : VN_DAY_LABELS[getTodayDayIndex(day)];
    return { key: dayKey(day), label, date: `${day.getDate()}/${day.getMonth() + 1}` };
  });
}

/** Episodes released in the window, grouped by day; each day lists the latest release first. */
export function groupReleases(releases: Release[], today: Date, count = RELEASE_WINDOW_DAYS): Map<string, Release[]> {
  const days = new Map(recentDays(today, count).map((d) => [d.key, [] as Release[]]));
  for (const release of releases) {
    if (!release.episode.publishedAt) continue;
    const at = new Date(release.episode.publishedAt);
    if (Number.isNaN(at.getTime())) continue;
    days.get(dayKey(at))?.push(release);
  }
  const time = (r: Release) => new Date(r.episode.publishedAt as string).getTime();
  days.forEach((list) => list.sort((a, b) => time(b) - time(a)));
  return days;
}

/** "20:15" in the device's time. */
export function releaseTime(iso: string): string {
  const at = new Date(iso);
  return `${pad(at.getHours())}:${pad(at.getMinutes())}`;
}
