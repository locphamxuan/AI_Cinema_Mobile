import { accessToken, accountRoutes, api, mockRoute, ok, renderApp, settle, signIn } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import { decision, movieRoutes } from './support/fixtures';
import MovieDetailScreen from '../../../app/movie/[id]';
import { useSessionStore } from '../../store';

describe('ST-MOB-05 Session expiry', () => {
  it('ST-MOB-05 refreshes an expired access token before opening a locked episode, so the member is not read as a Guest (D-18)', async () => {
    const fresh = accessToken(900);
    await signIn(undefined, accessToken(-60));
    api.on('POST /auth/refresh', ok({ accessToken: fresh, refreshToken: 'refresh-2' }));
    movieRoutes();
    accountRoutes({ main: 20, bonus: 15 });
    api.on('GET /episodes/ep-3/access', ok(decision('ep-3')));
    mockRoute.params = { id: 'm-1' };
    await renderApp(<MovieDetailScreen />);
    await settle();

    await fireEvent.press(screen.getByLabelText(/^Tập 3/));
    await settle();

    // The BE reads an expired token on this public route as a Guest: the refresh must come first.
    const refresh = api.calls.findIndex((c) => c.path === '/auth/refresh');
    const access = api.calls.findIndex((c) => c.path === '/episodes/ep-3/access');
    expect(refresh).toBeGreaterThanOrEqual(0);
    expect(refresh).toBeLessThan(access);
    expect(api.called('POST /auth/refresh')).toHaveLength(1);
    expect(api.calls[access].headers.Authorization).toBe(`Bearer ${fresh}`);
    // The member's own decision opens the unlock sheet, not the Guest sign-in prompt.
    expect(screen.getByText('Mở khóa tập 3')).toBeOnTheScreen();
    expect(useSessionStore.getState().isAuthenticated).toBe(true);
  });
});
