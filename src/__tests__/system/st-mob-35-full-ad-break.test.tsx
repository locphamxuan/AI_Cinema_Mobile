import { accountRoutes, api, mockVideo, ok, settle, signIn } from './support/harness';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { activePlan } from './support/fixtures';
import { aiLabels, episodePlayer, playEpisode, playTo } from './support/watch';
import { AD_LOAD_TIMEOUT_MS } from '../../components/player/PlaybackOverlays';
import { useAccountStore } from '../../store';

const cue = (breakId: string, positionSeconds: number) => ({
  breakId,
  positionSeconds,
  ad: { id: `ad-${breakId}`, title: 'Quảng cáo nước cam', mediaUrl: `https://cdn.test/${breakId}.mp4`, durationSeconds: 15 },
});
const adPlayer = (mediaUrl: string) => mockVideo.players.find((p) => p.source.uri === mediaUrl)!;
const played = (id: string) => api.called(`POST /playback/sessions/s-ep-1/ad-breaks/${id}/played`);
const completed = (id: string) => api.called(`POST /playback/sessions/s-ep-1/ad-breaks/${id}/completed`);

function adRoutes(...ids: string[]) {
  for (const id of ids) {
    api.on(`POST /playback/sessions/s-ep-1/ad-breaks/${id}/played`, ok({ status: 'COMPLETED' }));
    api.on(`POST /playback/sessions/s-ep-1/ad-breaks/${id}/completed`, ok({ completedView: true }));
  }
}

describe('ST-MOB-35 A mid-roll ad from start to end', () => {
  afterEach(() => jest.restoreAllMocks());

  it('ST-MOB-35 plays the whole ad with no seek or skip, then offers "Bỏ qua quảng cáo" and goes on from the same second', async () => {
    adRoutes('b1');
    const ad = cue('b1', 60);
    await playEpisode('ep-1', { adSchedule: [ad] });
    const episode = episodePlayer();
    await playTo(episode, 61);

    expect(screen.getByTestId('ad-break')).toBeOnTheScreen();
    expect(episode.playing).toBe(false);
    expect(played('b1')).toHaveLength(1);
    // While the ad runs there are no player controls (no seek, no fullscreen) and no skip.
    expect(screen.queryByLabelText('Toàn màn hình')).toBeNull();
    expect(screen.queryByTestId('ad-skip')).toBeNull();
    expect(aiLabels()).toHaveLength(1);

    // Half-way through: still no skip and nothing recorded as completed.
    await playTo(adPlayer(ad.ad.mediaUrl), 8);
    expect(screen.queryByTestId('ad-skip')).toBeNull();
    expect(completed('b1')).toHaveLength(0);

    // The ad reaches its end: the completed view is recorded once and the skip button appears.
    await act(() => adPlayer(ad.ad.mediaUrl).emit('playToEnd'));
    await settle();
    expect(completed('b1')).toHaveLength(1);
    expect(episode.playing).toBe(false);
    await fireEvent.press(screen.getByText('Bỏ qua quảng cáo ›'));
    await settle();
    expect(screen.queryByTestId('ad-break')).toBeNull();
    expect(episode.playing).toBe(true);
    expect(episode.currentTime).toBe(61);
    expect(completed('b1')).toHaveLength(1);

    // Seeking back before the cue and past it again never plays the same ad twice.
    await playTo(episode, 30);
    await playTo(episode, 70);
    expect(screen.queryByTestId('ad-break')).toBeNull();
    expect(played('b1')).toHaveLength(1);
  });

  it('ST-MOB-35 shows the ad in place in fullscreen and picks it up again when the app comes back', async () => {
    const listeners: ((state: AppStateStatus) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
      listeners.push(handler as (state: AppStateStatus) => void);
      return { remove: () => undefined };
    });
    adRoutes('b1');
    const ad = cue('b1', 60);
    await playEpisode('ep-1', { adSchedule: [ad] });
    await fireEvent.press(screen.getByLabelText('Toàn màn hình'));
    const surfaces = mockVideo.viewMounts;
    await playTo(episodePlayer(), 61);

    expect(screen.getByTestId('player-fullscreen')).toBeOnTheScreen();
    expect(screen.getByTestId('ad-break')).toBeOnTheScreen();
    // Only the ad's own surface was added: the episode video was not rebuilt.
    expect(mockVideo.viewMounts).toBe(surfaces + 1);

    // The app went to the background and came back: the ad goes on, the episode stays paused under it.
    const player = adPlayer(ad.ad.mediaUrl);
    player.pause();
    player.play.mockClear();
    await act(() => listeners.forEach((fn) => fn('active')));
    expect(player.play).toHaveBeenCalled();
    expect(episodePlayer().playing).toBe(false);
  });

  it('ST-MOB-35 skips an ad whose video fails, logs it, and never holds the episode', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    adRoutes('b1');
    const broken = cue('b1', 60);
    await playEpisode('ep-1', { adSchedule: [broken] });
    const episode = episodePlayer();

    await playTo(episode, 61);
    await act(() => adPlayer(broken.ad.mediaUrl).emit('statusChange', { status: 'error', error: { message: 'HTTP 404' } }));
    await settle();
    expect(screen.queryByTestId('ad-break')).toBeNull();
    expect(episode.playing).toBe(true);
    expect(episode.currentTime).toBe(61);
    expect(completed('b1')).toHaveLength(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('HTTP 404'));
  });

  it('ST-MOB-35 skips an ad video that never loads after a while', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Fake clock that still moves with real time, so the app settles as usual and the wait can be jumped.
    jest.useFakeTimers({ advanceTimers: true });
    const stuck = cue('b2', 60);
    mockVideo.notReady = [stuck.ad.mediaUrl];
    try {
      adRoutes('b2');
      await playEpisode('ep-1', { adSchedule: [stuck] });
      const episode = episodePlayer();
      await playTo(episode, 61);
      expect(screen.getByTestId('ad-break')).toBeOnTheScreen();
      await act(() => jest.advanceTimersByTime(AD_LOAD_TIMEOUT_MS));
      await settle();
      expect(screen.queryByTestId('ad-break')).toBeNull();
      expect(episode.playing).toBe(true);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('không tải được'));
    } finally {
      mockVideo.notReady = [];
      jest.useRealTimers();
    }
  });

  it('ST-MOB-35 plays the ads the BE laid even when the phone still remembers a Monthly plan', async () => {
    await signIn();
    accountRoutes({ subscription: activePlan() });
    api.on('GET /playback/history', ok([]));
    await act(() => useAccountStore.getState().loadAccountData());
    adRoutes('b1');
    await playEpisode('ep-1', { adSchedule: [cue('b1', 60)] });
    await playTo(episodePlayer(), 61);
    expect(screen.getByTestId('ad-break')).toBeOnTheScreen();
  });
});
