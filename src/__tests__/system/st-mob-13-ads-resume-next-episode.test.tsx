import { accountRoutes, api, mockVideo, ok, settle, signIn } from './support/harness';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { activePlan, granted, streamingSession } from './support/fixtures';
import { episodePlayer, playEpisode, playTo } from './support/watch';
import { useAccountStore } from '../../store';

const midRoll = {
  breakId: 'brk-1',
  positionSeconds: 60,
  ad: { id: 'ad-1', title: 'Quảng cáo nước cam', mediaUrl: 'https://cdn.test/ad.mp4', durationSeconds: 15 },
};
const adPlayer = () => mockVideo.players.find((p) => p.source.uri === midRoll.ad.mediaUrl)!;

describe('ST-MOB-13 Ads, resume and next episode', () => {
  it('ST-MOB-13 plays the mid-roll of a Guest or Standard plan and lets it be skipped only after the ad', async () => {
    api.on('POST /playback/sessions/s-ep-1/ad-breaks/brk-1/played', ok({}));
    api.on('POST /playback/sessions/s-ep-1/ad-breaks/brk-1/completed', ok({}));
    await playEpisode('ep-1', { adSchedule: [midRoll] });
    const player = episodePlayer();
    await playTo(player, 61);

    expect(screen.getByTestId('ad-break')).toBeOnTheScreen();
    expect(player.pause).toHaveBeenCalled();
    // No skip while the ad runs: only the countdown.
    expect(screen.queryByTestId('ad-skip')).toBeNull();
    expect(screen.getByText('Quảng cáo · 0:15')).toBeOnTheScreen();
    // The AI label stays on top of the ad too (BR-10).
    expect(screen.getAllByTestId('ai-label-overlay')).toHaveLength(1);

    await act(() => adPlayer().emit('playToEnd'));
    expect(screen.getByTestId('ad-skip')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Bỏ qua quảng cáo ›'));
    await settle();
    expect(screen.queryByTestId('ad-break')).toBeNull();
    expect(api.called('POST /playback/sessions/s-ep-1/ad-breaks/brk-1/played')).toHaveLength(1);
    expect(api.called('POST /playback/sessions/s-ep-1/ad-breaks/brk-1/completed')).toHaveLength(1);
  });

  it('ST-MOB-13 shows no mid-roll to a Monthly member: the BE lays no cue for a running plan', async () => {
    await signIn();
    accountRoutes({ subscription: activePlan() });
    api.on('GET /playback/history', ok([]));
    await act(() => useAccountStore.getState().loadAccountData());
    await playEpisode('ep-1', { adSchedule: [] });
    await playTo(episodePlayer(), 61);
    expect(screen.queryByTestId('ad-break')).toBeNull();
    expect(api.called('POST /playback/sessions/s-ep-1/ad-breaks/brk-1/played')).toHaveLength(0);
  });

  it('ST-MOB-13 offers to resume where the member stopped', async () => {
    await playEpisode('ep-1', { resumePositionSeconds: 300 });
    expect(screen.getByText('Bạn đã xem tới 5:00')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Xem tiếp'));
    expect(episodePlayer().currentTime).toBe(300);
    expect(screen.queryByText('Bạn đã xem tới 5:00')).toBeNull();
  });

  it('ST-MOB-13 completes the finished episode and asks the BE before the next one opens', async () => {
    api.on('POST /playback/sessions/s-ep-1/complete', ok({ status: 'COMPLETED' }));
    await playEpisode('ep-1');
    await playTo(episodePlayer(), 1200);
    await act(() => episodePlayer().emit('playToEnd'));
    await settle();
    expect(api.called('POST /playback/sessions/s-ep-1/complete')).toHaveLength(1);

    api.on('GET /episodes/ep-2/access', ok(granted('ep-2', 'FREE')));
    api.on('POST /playback/sessions', ok(streamingSession('ep-2'), 201));
    const before = api.calls.length;
    await fireEvent.press(screen.getByLabelText(/^Tập 2/));
    await settle();
    const after = api.calls.slice(before).map((c) => `${c.method} ${c.path}`);
    expect(after.indexOf('GET /episodes/ep-2/access')).toBeGreaterThanOrEqual(0);
    expect(after.indexOf('GET /episodes/ep-2/access')).toBeLessThan(after.indexOf('POST /playback/sessions'));
    expect(episodePlayer('ep-2')).toBeDefined();
  });
});
