import { accountRoutes, api, doubleTap, mockRoute, mockRouter, ok, renderApp, settle, signIn } from './support/harness';
import { fireEvent, screen, within } from '@testing-library/react-native';
import { decision, movieRoutes } from './support/fixtures';
import MovieDetailScreen from '../../../app/movie/[id]';
import { useAccountStore } from '../../store';

const purchase = { episodeId: 'ep-3', paidCoins: 30, charged: { mainCoins: 20, bonusCoins: 10 }, mainBalance: 0, bonusBalance: 5, accessGranted: true };
const row = (label: string) => screen.getByText(label).parent!;

describe('ST-MOB-10 Unlock with Coins', () => {
  it('ST-MOB-10 shows Main Coins first and Bonus Coins for the rest, and charges once on a double tap', async () => {
    await signIn();
    movieRoutes();
    accountRoutes({ main: 20, bonus: 15 });
    api.on('GET /playback/history', ok([]));
    api.on('GET /episodes/ep-3/access', ok(decision('ep-3')));
    api.slow('POST /episodes/ep-3/purchase', ok(purchase, 201));
    mockRoute.params = { id: 'm-1' };
    await renderApp(<MovieDetailScreen />);
    await settle();

    await fireEvent.press(screen.getByLabelText('Tập 3, 30 Coin'));
    await settle();
    // BR-01: 30 Coin = all 20 Main Coins, then 10 Bonus Coins.
    expect(within(row('Trừ Coin chính')).getByText('20')).toBeOnTheScreen();
    expect(within(row('Trừ Coin thưởng')).getByText('10')).toBeOnTheScreen();
    expect(within(row('Còn lại')).getByText('0 chính, 5 thưởng')).toBeOnTheScreen();
    expect(screen.getByText('Coin chính được trừ trước, Coin thưởng bù phần còn thiếu.')).toBeOnTheScreen();

    await doubleTap(screen.getByRole('button', { name: 'Mở khóa với 30 Coin' }));
    await settle();
    const buys = api.called('POST /episodes/ep-3/purchase');
    expect(buys).toHaveLength(1);
    expect(buys[0].headers['Idempotency-Key']).toMatch(/^ep-/);
    expect(useAccountStore.getState().wallet).toEqual({ mainCoin: 0, bonusCoin: 5 });
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/watch/[id]', params: { id: 'm-1', episodeId: 'ep-3' } });
  });
});
