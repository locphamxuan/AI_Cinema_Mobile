import { latestPerMovie, resumeEpisode, watchProgress } from '../lib/watchHistory';
import { confirmSignOut } from '../lib/signOut';
import { useDialogStore } from '../store/dialogStore';
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

describe('watchProgress', () => {
  it('shows where the member stopped out of the episode length, and how far along for the bar', () => {
    expect(watchProgress({ episodeNumber: 3, positionSeconds: 754, durationSeconds: 2700, completed: false })).toEqual({
      label: 'Tập 3 · 12:34 / 45:00',
      ratio: 754 / 2700,
    });
  });

  it('says a finished episode is done, and shows the position alone when the length is unknown', () => {
    expect(watchProgress({ episodeNumber: 1, positionSeconds: 2700, durationSeconds: 2700, completed: true })).toEqual({
      label: 'Tập 1 · Đã xem hết',
      ratio: 1,
    });
    expect(watchProgress({ episodeNumber: 2, positionSeconds: 95, durationSeconds: null, completed: false })).toEqual({
      label: 'Tập 2 · đang ở 1:35',
      ratio: 0,
    });
    expect(watchProgress({ episodeNumber: 2, positionSeconds: 9999, durationSeconds: 100, completed: false }).ratio).toBe(1);
  });
});

describe('confirmSignOut', () => {
  it('asks first, and signs out then leaves only on confirmation', () => {
    const logout = jest.fn();
    const leave = jest.fn();
    useDialogStore.setState({ queue: [] });
    confirmSignOut(logout, leave);
    const dialog = useDialogStore.getState().queue[0];
    expect(dialog.title).toBe('Đăng xuất?');
    expect(logout).not.toHaveBeenCalled();
    dialog.buttons.find((b) => b.text === 'Đăng xuất')!.onPress!();
    expect(logout).toHaveBeenCalled();
    expect(leave).toHaveBeenCalled();
    useDialogStore.setState({ queue: [] });
  });
});
