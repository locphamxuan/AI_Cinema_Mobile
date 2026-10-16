import { dayKey, groupReleases, recentDays, releaseTime, type Release } from '../lib/releaseDays';
import { adaptApiEpisodeToEpisode } from '../lib/apiAdapter';
import type { Episode, Movie } from '../types/movie';

// Friday 16 October 2026, 21:00 on the device clock.
const today = new Date(2026, 9, 16, 21, 0);
const film = { id: 'm1', title: 'Phim' } as Movie;
const release = (id: string, publishedAt: string | null): Release => ({
  movie: film,
  episode: { id, publishedAt } as Episode,
});
const at = (day: number, hour: number) => new Date(2026, 9, day, hour, 30).toISOString();

describe('release days', () => {
  it('lists today, yesterday, then weekdays with their dates', () => {
    const days = recentDays(today);
    expect(days).toHaveLength(7);
    expect(days.slice(0, 3)).toEqual([
      { key: '2026-10-16', label: 'Hôm nay', date: '16/10' },
      { key: '2026-10-15', label: 'Hôm qua', date: '15/10' },
      { key: '2026-10-14', label: 'T4', date: '14/10' },
    ]);
    expect(days[6]).toEqual({ key: '2026-10-10', label: 'T7', date: '10/10' });
  });

  it('crosses a month boundary', () => {
    expect(recentDays(new Date(2026, 10, 2), 3).map((d) => d.key)).toEqual(['2026-11-02', '2026-11-01', '2026-10-31']);
  });

  it('groups episodes by the day they came out, latest first, inside the window only', () => {
    const groups = groupReleases(
      [release('a', at(16, 8)), release('b', at(16, 20)), release('c', at(14, 9)), release('old', at(2, 9)), release('none', null)],
      today,
    );
    expect(groups.get('2026-10-16')?.map((r) => r.episode.id)).toEqual(['b', 'a']);
    expect(groups.get('2026-10-14')?.map((r) => r.episode.id)).toEqual(['c']);
    expect(groups.get('2026-10-15')).toEqual([]);
    expect([...groups.values()].flat().map((r) => r.episode.id)).not.toContain('old');
  });

  it('formats the day key and release time in local time', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(releaseTime(new Date(2026, 9, 16, 7, 5).toISOString())).toBe('07:05');
  });

  it('reads publishedAt from the episode payload', () => {
    expect(adaptApiEpisodeToEpisode({ id: 'e', publishedAt: '2026-10-16T13:00:00.000Z' }).publishedAt).toBe('2026-10-16T13:00:00.000Z');
    expect(adaptApiEpisodeToEpisode({ id: 'e' }).publishedAt).toBeNull();
  });
});
