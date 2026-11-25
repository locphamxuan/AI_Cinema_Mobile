import { MEMBER, accountRoutes, api, beUser, ok, renderApp, sessionReply, settle, signIn } from './system/support/harness';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { movieDto } from './system/support/fixtures';
import HomeScreen from '../../app/(tabs)/index';
import { useSessionStore, useUiStore } from '../store';
import { isNewAccount, NEW_ACCOUNT_WINDOW_MS } from '../lib/homeFeed';

const catalog = [movieDto({ id: 'm-old', title: 'Phim Cũ', releaseYear: 2020 }), movieDto({ id: 'm-new', title: 'Phim Mới Ra', releaseYear: 2026 })];
const tab = (name: string) => screen.getByRole('tab', { name });

function memberHome(forYou: unknown[] = []) {
  accountRoutes();
  api.on('GET /movies', ok(catalog));
  api.on('GET /auth/me', ok(beUser()));
  api.on('GET /daily-rewards/status', ok(null));
  api.on('GET /recommendations/for-you', ok(forYou));
}

describe('isNewAccount', () => {
  const now = Date.parse('2026-11-25T08:00:00.000Z');
  it('counts an account created moments ago as just opened', () => {
    expect(isNewAccount('2026-11-25T07:59:30.000Z', now)).toBe(true);
    // A phone clock a little behind the server's still counts.
    expect(isNewAccount('2026-11-25T08:02:00.000Z', now)).toBe(true);
  });

  it('treats an older account, or no readable date, as an existing one', () => {
    expect(isNewAccount(new Date(now - NEW_ACCOUNT_WINDOW_MS - 1000).toISOString(), now)).toBe(false);
    expect(isNewAccount('2026-01-01T00:00:00.000Z', now)).toBe(false);
    expect(isNewAccount(undefined, now)).toBe(false);
    expect(isNewAccount('not a date', now)).toBe(false);
  });
});

describe('a new member lands on "Phim mới"', () => {
  it('asks Home for "Phim mới" after an e-mail sign-up', async () => {
    api.on('POST /auth/register', sessionReply());
    accountRoutes();
    await act(async () => {
      await useSessionStore.getState().register('Lan Anh', 'lan.anh@example.com', 'Matkhau123', '2000-05-14');
    });
    expect(useUiStore.getState().homeTabRequest).toBe('new');
  });

  it('asks for it after the Google sign-in that opens the account, not after a returning one', async () => {
    accountRoutes();
    api.on('POST /auth/google', sessionReply('MEMBER', { createdAt: '2026-01-01T00:00:00.000Z' }));
    await act(async () => {
      await useSessionStore.getState().loginWithGoogle('google-id-token');
    });
    expect(useUiStore.getState().homeTabRequest).toBeNull();

    api.on('POST /auth/google', sessionReply('MEMBER', { createdAt: new Date().toISOString() }));
    await act(async () => {
      await useSessionStore.getState().loginWithGoogle('google-id-token');
    });
    expect(useUiStore.getState().homeTabRequest).toBe('new');
  });

  it('does not move a member who signs in with a password', async () => {
    api.on('POST /auth/login', sessionReply('MEMBER', { createdAt: new Date().toISOString() }));
    accountRoutes();
    await act(async () => {
      await useSessionStore.getState().login('lan.anh@example.com', 'Matkhau123');
    });
    expect(useUiStore.getState().homeTabRequest).toBeNull();
  });

  it('opens Home on "Phim mới", newest first, and uses the request once', async () => {
    await signIn();
    memberHome();
    await act(() => useUiStore.getState().requestHomeTab('new'));
    await renderApp(<HomeScreen />);
    await settle();
    expect(tab('Phim mới').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText('Phim Mới Ra')).toBeOnTheScreen();
    expect(useUiStore.getState().homeTabRequest).toBeNull();
  });

  it('switches an open Home to "Phim mới" when the account is opened from it', async () => {
    await signIn(MEMBER);
    memberHome();
    await renderApp(<HomeScreen />);
    await settle();
    expect(tab('Đề xuất').props.accessibilityState).toEqual({ selected: true });
    await act(() => useUiStore.getState().requestHomeTab('new'));
    expect(tab('Phim mới').props.accessibilityState).toEqual({ selected: true });
  });
});

describe('an empty "Đề xuất" list', () => {
  it('offers a button that opens "Phim mới"', async () => {
    await signIn();
    memberHome([]);
    await renderApp(<HomeScreen />);
    await settle();
    expect(screen.getByText(/Chưa có phim để đề xuất/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Xem phim mới' }));
    expect(tab('Phim mới').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText('Phim Mới Ra')).toBeOnTheScreen();
    expect(screen.getByLabelText('Phim Cũ')).toBeOnTheScreen();
  });

  it('shows no such button when there are picks', async () => {
    await signIn();
    memberHome([{ movieId: 'm-old', title: 'Phim Cũ', ageRating: 'T13', posterUrl: null, score: 0.8, source: 'hybrid', reason: null }]);
    await renderApp(<HomeScreen />);
    await settle();
    expect(screen.getByText('Đề xuất dành riêng cho bạn')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Xem phim mới' })).toBeNull();
  });
});
