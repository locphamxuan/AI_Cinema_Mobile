import { accountRoutes, answerDialog, api, fail, mockRoute, mockRouter, ok, renderApp, settle, shownDialog, signIn } from './support/harness';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { activePlan, decision, hoursFromNow, monthlyPlan, movieRoutes } from './support/fixtures';
import MovieDetailScreen from '../../../app/movie/[id]';
import VipScreen from '../../../app/vip';
import { useAccountStore, useUiStore } from '../../store';

async function openLockedEpisode() {
  await signIn();
  movieRoutes();
  accountRoutes({ main: 20, bonus: 15 });
  api.on('GET /playback/history', ok([]));
  api.on('GET /episodes/ep-3/access', ok(decision('ep-3')));
  await act(() => useAccountStore.getState().loadAccountData());
  mockRoute.params = { id: 'm-1' };
  await renderApp(<MovieDetailScreen />);
  await settle();
  await fireEvent.press(screen.getByLabelText('Tập 3, 30 Coin'));
  await settle();
}

describe('ST-MOB-33 Unlock and plan refusals', () => {
  it('ST-MOB-33 plays an episode the BE says is already owned, with nothing charged', async () => {
    await openLockedEpisode();
    api.on('POST /episodes/ep-3/purchase', fail(409, 'The episode is already unlocked', 'ACCESS_ALREADY_OWNED'));
    await fireEvent.press(screen.getByRole('button', { name: 'Mở khóa với 30 Coin' }));
    await settle();
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/watch/[id]', params: { id: 'm-1', episodeId: 'ep-3' } });
    expect(useAccountStore.getState().wallet).toEqual({ mainCoin: 20, bonusCoin: 15 });
  });

  it('ST-MOB-33 turns the unlock into a top-up when the wallet ran short meanwhile', async () => {
    await openLockedEpisode();
    api.on('POST /episodes/ep-3/purchase', fail(422, 'Not enough Coins', 'INSUFFICIENT_COINS'));
    api.on('GET /wallet/top-ups/options', ok({ rateVnd: 1000, minVnd: 10_000, maxVnd: 2_000_000 }));
    await fireEvent.press(screen.getByRole('button', { name: 'Mở khóa với 30 Coin' }));
    await settle();
    expect(screen.getByText(/Ví không còn đủ Coin cho tập này/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Nạp Coin' }));
    expect(useUiStore.getState().isTopUpModalOpen).toBe(true);
  });

  it('ST-MOB-33 offers a top-up instead of joining the plan with a short wallet', async () => {
    await signIn();
    accountRoutes({ main: 30, bonus: 10 });
    api.on('GET /membership-plans', ok([monthlyPlan]));
    api.on('GET /wallet/top-ups/options', ok({ rateVnd: 1000, minVnd: 10_000, maxVnd: 2_000_000 }));
    await act(() => useAccountStore.getState().loadAccountData());
    await renderApp(<VipScreen />);
    await settle();

    await fireEvent.press(screen.getByRole('button', { name: 'Đăng ký' }));
    expect(shownDialog()).toMatchObject({ title: 'Chưa đủ Coin cho Gói Tháng' });
    expect(shownDialog()?.message).toContain('ví còn thiếu 59 Coin');
    await answerDialog('Nạp Coin');
    expect(useUiStore.getState()).toMatchObject({ isTopUpModalOpen: true, pendingPurchase: { kind: 'plan', planId: 'plan-monthly' } });
    expect(api.called('POST /subscriptions')).toHaveLength(0);
  });

  it('ST-MOB-33 sends no cancel past the 24 h mark (BR-05)', async () => {
    await signIn();
    accountRoutes({ subscription: activePlan({ currentPeriodEnd: hoursFromNow(5), cancelDeadline: hoursFromNow(-19) }) });
    api.on('GET /membership-plans', ok([monthlyPlan]));
    await act(() => useAccountStore.getState().loadAccountData());
    await renderApp(<VipScreen />);
    await settle();
    await fireEvent(screen.getByLabelText('Tự gia hạn'), 'valueChange', false);
    expect(shownDialog()?.title).toBe('Chưa tắt được tự gia hạn');
    expect(api.called('POST /subscriptions/sub-1/cancel-auto-renew')).toHaveLength(0);
  });
});
