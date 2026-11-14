import { latestPerMovie, resumeEpisode } from '../lib/watchHistory';
import { playbackService } from '../services/playbackService';
import { apiClient } from '../services/apiClient';
import type { Episode } from '../types/movie';
import type { WatchHistoryEntry } from '../types/playback';

const row = (movieId: string, episodeId: string, extra: Partial<WatchHistoryEntry> = {}): WatchHistoryEntry => ({
  episodeId,
  episodeTitle: `Tập ${episodeId}`,
  episodeNumber: Number(episodeId.slice(1)),
  thumbnailUrl: null,
  movieId,
  movieTitle: `Phim ${movieId}`,
  positionSeconds: 120,
  durationSeconds: 600,
  completed: false,
  lastWatchedAt: '2026-11-09T01:00:00.000Z',
  available: true,
  notice: null,
  ...extra,
});

const episode = (id: string) => ({ id, episodeNumber: Number(id.slice(1)) }) as Episode;
const episodes = [episode('e1'), episode('e2'), episode('e3')];

afterEach(async () => {
  jest.restoreAllMocks();
  await apiClient.clearSession();
});

describe('watch history', () => {
  it('keeps the newest episode of each film', () => {
    const history = [row('m1', 'e2'), row('m2', 'e1'), row('m1', 'e1')];
    expect(latestPerMovie(history).map((r) => `${r.movieId}/${r.episodeId}`)).toEqual(['m1/e2', 'm2/e1']);
  });

  it('resumes the newest episode opened in the film', () => {
    expect(resumeEpisode([row('m2', 'e3'), row('m1', 'e2'), row('m1', 'e1')], 'm1', episodes)?.id).toBe('e2');
  });

  it('moves on to the next episode once the last one is finished', () => {
    expect(resumeEpisode([row('m1', 'e2', { completed: true })], 'm1', episodes)?.id).toBe('e3');
    // The final episode stays the target when there is nothing after it.
    expect(resumeEpisode([row('m1', 'e3', { completed: true })], 'm1', episodes)?.id).toBe('e3');
  });

  it('skips rows the BE flags as not openable, and films never opened', () => {
    expect(resumeEpisode([row('m1', 'e2', { available: false, notice: 'Đang chỉnh sửa' })], 'm1', episodes)).toBeUndefined();
    expect(resumeEpisode([row('m2', 'e1')], 'm1', episodes)).toBeUndefined();
    expect(resumeEpisode([row('m1', 'e9')], 'm1', episodes)).toBeUndefined();
  });

  it('reads the history page from GET /playback/history', async () => {
    await apiClient.saveSession({ accessToken: 'member' });
    const page = { data: [row('m1', 'e1')], meta: { totalItems: 1 } };
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify(page) } as Response);

    const res = await playbackService.history();

    expect(res.data).toEqual(page.data);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/playback\/history\?limit=50$/);
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer member');
  });
});
