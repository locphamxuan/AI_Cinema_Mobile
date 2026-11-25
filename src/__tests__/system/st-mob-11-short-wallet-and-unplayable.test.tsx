import { accountRoutes, api, mockRoute, ok, renderApp, settle, shownDialog, signIn } from './support/harness';
import { fireEvent, screen, within } from '@testing-library/react-native';
import { decision, movieRoutes } from './support/fixtures';
import MovieDetailScreen from '../../../app/movie/[id]';
import { useUiStore } from '../../store';

async function openMovie() {
  await signIn();
  movieRoutes();
  accountRoutes({ main: 10, bonus: 10 });
  api.on('GET /playback/history', ok([]));
  api.on('GET /wallet/top-ups/options', ok({ rateVnd: 1000, minVnd: 10_000, maxVnd: 2_000_000 }));
  mockRoute.params = { id: 'm-1' };
  await renderApp(<MovieDetailScreen />);
  await settle();
}

describe('ST-MOB-11 Short wallet and unplayable episode', () => {
  it('ST-MOB-11 offers a top-up when the wallet is short of the price', async () => {
    api.on(
      'GET /episodes/ep-3/access',
      ok(decision('ep-3', { required: { coinPrice: 30, mainBalance: 10, bonusBalance: 10, enoughCoins: false, missingCoins: 10 }, nextAction: 'OBTAIN_COIN' })),
    );
    await openMovie();
    await fireEvent.press(screen.getByLabelText('Tập 3, 30 Coin'));
    await settle();

    expect(within(screen.getByText('Còn thiếu').parent!).getByText('10 Coin')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Mở khóa với/ })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Nạp Coin' }));
    await settle();
    expect(useUiStore.getState().isTopUpModalOpen).toBe(true);
    // After paying the member is offered to go back to this episode.
    expect(useUiStore.getState().pendingPurchase).toMatchObject({ kind: 'episode', episode: { id: 'ep-3' } });
    expect(api.called('POST /episodes/ep-3/purchase')).toHaveLength(0);
  });

  it('ST-MOB-11 explains an episode the BE cannot play instead of offering it for sale', async () => {
    api.on(
      'GET /episodes/ep-3/access',
      ok(decision('ep-3', { accessMethods: [], nextAction: 'NOT_PLAYABLE', availability: 'MEDIA_NOT_READY', notice: 'Tập này đang được xử lý video.' })),
    );
    await openMovie();
    await fireEvent.press(screen.getByLabelText('Tập 3, 30 Coin'));
    await settle();

    expect(shownDialog()).toMatchObject({ title: 'Tập chưa xem được', message: 'Tập này đang được xử lý video.' });
    expect(screen.getByText('Tập chưa xem được')).toBeOnTheScreen();
    expect(screen.queryByText('Mở khóa tập 3')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Nạp Coin' })).toBeNull();
  });
});
