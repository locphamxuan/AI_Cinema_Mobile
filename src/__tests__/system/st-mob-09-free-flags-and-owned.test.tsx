import { accountRoutes, api, mockRoute, mockRouter, ok, renderApp, settle, signIn } from './support/harness';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { decision, granted, movieRoutes } from './support/fixtures';
import MovieDetailScreen from '../../../app/movie/[id]';
import { useAccountStore, useUiStore } from '../../store';

const watchEpisode = (episodeId: string) =>
  expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/watch/[id]', params: { id: 'm-1', episodeId } });

async function openMovie() {
  mockRoute.params = { id: 'm-1' };
  await renderApp(<MovieDetailScreen />);
  await settle();
}

describe('ST-MOB-09 Free flags and owned episodes', () => {
  it('ST-MOB-09 asks a Guest to sign in for an episode free for Members only', async () => {
    movieRoutes();
    api.on(
      'GET /episodes/ep-2/access',
      ok(decision('ep-2', { actorType: 'GUEST', accessMethods: ['REGISTER_OR_LOGIN'], nextAction: 'REGISTER_OR_LOGIN' })),
    );
    await openMovie();
    await fireEvent.press(screen.getByLabelText(/^Tập 2/));
    await settle();
    expect(api.called('GET /episodes/ep-2/access')).toHaveLength(1);
    expect(useUiStore.getState()).toMatchObject({ isAuthModalOpen: true, authModalMode: 'login' });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('ST-MOB-09 plays an episode free for Members to a Member, as the BE decides', async () => {
    await signIn();
    movieRoutes();
    accountRoutes();
    api.on('GET /playback/history', ok([]));
    api.on('GET /episodes/ep-2/access', ok(granted('ep-2', 'FREE')));
    await openMovie();
    // The list hint shows no price for it, and the BE still decides when it opens.
    expect(screen.getByLabelText('Tập 2')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Tập 2'));
    await settle();
    expect(api.called('GET /episodes/ep-2/access')).toHaveLength(1);
    watchEpisode('ep-2');
  });

  it('ST-MOB-09 opens an episode bought earlier without asking to pay again (D-19)', async () => {
    await signIn();
    movieRoutes();
    accountRoutes({ owned: ['ep-3'] });
    api.on('GET /playback/history', ok([]));
    api.on('GET /episodes/ep-3/access', ok(granted('ep-3', 'EPISODE_PURCHASE')));
    // The start-up read of the account (bootstrap) brings the episodes this member owns.
    await act(() => useAccountStore.getState().loadAccountData());
    await openMovie();
    expect(screen.getByLabelText('Tập 3')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Tập 3'));
    await settle();
    watchEpisode('ep-3');
    expect(screen.queryByText(/^Mở khóa/)).toBeNull();
    expect(api.called('POST /episodes/ep-3/purchase')).toHaveLength(0);
  });
});
