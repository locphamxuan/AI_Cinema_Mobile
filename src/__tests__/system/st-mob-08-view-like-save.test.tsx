import { accountRoutes, api, mockRoute, ok, renderApp, settle, signIn } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import { movieDto, movieRoutes } from './support/fixtures';
import MovieDetailScreen from '../../../app/movie/[id]';
import SavedScreen from '../../../app/saved';
import { useUiStore } from '../../store';

describe('ST-MOB-08 View, like and save', () => {
  it('ST-MOB-08 shows the movie and asks a Guest to sign in before a heart', async () => {
    movieRoutes();
    mockRoute.params = { id: 'm-1' };
    await renderApp(<MovieDetailScreen />);
    await settle();

    expect(screen.getByText('Mùa Hạ Trong Gương')).toBeOnTheScreen();
    expect(screen.getAllByText('3 tập').length).toBeGreaterThan(0);
    await fireEvent.press(screen.getAllByLabelText('Thả tim')[0]);
    expect(useUiStore.getState()).toMatchObject({ isAuthModalOpen: true, authModalMode: 'login' });
    expect(api.called('POST /movies/m-1/like')).toHaveLength(0);
  });

  it('ST-MOB-08 lets a Member like and save, and the movie is on Saved', async () => {
    await signIn();
    movieRoutes();
    accountRoutes();
    api.on('GET /playback/history', ok([]));
    api.on('GET /saved-movies/m-1', ok({ saved: false }));
    api.on('POST /movies/m-1/like', ok({ movieId: 'm-1', likeCount: 13, viewCount: 340, likedByMe: true }));
    api.on('PUT /saved-movies/m-1', ok({ saved: true }));
    mockRoute.params = { id: 'm-1' };
    const view = await renderApp(<MovieDetailScreen />);
    await settle();

    await fireEvent.press(screen.getAllByLabelText('Thả tim')[0]);
    await fireEvent.press(screen.getAllByLabelText('Lưu phim')[0]);
    await settle();
    expect(api.called('POST /movies/m-1/like')).toHaveLength(1);
    expect(api.called('PUT /saved-movies/m-1')).toHaveLength(1);
    expect(screen.getAllByLabelText('Bỏ tim').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Bỏ lưu phim').length).toBeGreaterThan(0);
    await view.unmount();

    api.on('GET /saved-movies', ok([movieDto()]));
    await renderApp(<SavedScreen />);
    await settle();
    expect(screen.getByText('Mùa Hạ Trong Gương')).toBeOnTheScreen();
  });
});
