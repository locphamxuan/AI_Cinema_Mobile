import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadInitialData, signOutEverywhere, useAccountStore, useCatalogStore, useSessionStore, useUiStore } from '../store';
import { apiClient } from '../services/apiClient';
import type { Episode, Movie } from '../types/movie';

/** Answers each fetch by `METHOD path` (without the /api prefix) and records the calls. */
function routeFetch(routes: Record<string, { status?: number; body?: unknown }>) {
  return jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
    const path = new URL(String(input), 'http://x').pathname.replace(/^\/api/, '');
    const route = routes[`${init?.method ?? 'GET'} ${path}`] ?? { status: 404, body: { message: 'not found' } };
    const status = route.status ?? 200;
    return {
      ok: status < 400,
      status,
      text: async () => (route.body === undefined ? '' : JSON.stringify(route.body)),
      json: async () => route.body,
    } as Response;
  });
}

const calledPaths = (fetchMock: jest.SpyInstance) =>
  fetchMock.mock.calls.map(([url, init]) => `${init?.method ?? 'GET'} ${new URL(String(url), 'http://x').pathname.replace(/^\/api/, '')}`);

const plan = (status: string, end: string) => ({
  id: 'sub-1',
  status,
  autoRenew: true,
  priceCoins: 900,
  currentPeriodStart: '2026-10-01T00:00:00.000Z',
  currentPeriodEnd: end,
  nextRenewalAt: null,
  cancelDeadline: null,
  plan: { id: 'p', code: 'MONTHLY', name: 'Gói Tháng', durationDays: 30 },
});

const movie = (id: string, episodes: Partial<Episode>[] = []) => ({ id, title: id, episodes }) as unknown as Movie;

beforeEach(() => {
  signOutEverywhere();
  useCatalogStore.setState({ movies: [], currentMovie: null });
  useUiStore.setState({ isAuthModalOpen: false, isCheckInModalOpen: false, isRewardSpinOpen: false, isTopUpModalOpen: false });
});

afterEach(async () => {
  jest.restoreAllMocks();
  await apiClient.clearSession();
});

describe('account store', () => {
  it('reads both balances and the plan from the BE', async () => {
    routeFetch({
      'GET /wallet': { body: { mainBalance: 40, bonusBalance: 7 } },
      'GET /subscriptions/me': { body: plan('ACTIVE', '2999-01-01T00:00:00.000Z') },
    });

    await useAccountStore.getState().loadAccountData();

    const account = useAccountStore.getState();
    expect(account.wallet).toEqual({ mainCoin: 40, bonusCoin: 7 });
    expect(account.subscription?.status).toBe('ACTIVE');
    expect(account.isVIPMode).toBe(true);
  });

  it('turns the plan flag off once the paid period is over', async () => {
    useAccountStore.setState({ isVIPMode: true });
    routeFetch({
      'GET /wallet': { body: { mainBalance: 0, bonusBalance: 0 } },
      'GET /subscriptions/me': { body: plan('ACTIVE', '2000-01-01T00:00:00.000Z') },
    });

    await useAccountStore.getState().loadAccountData();

    expect(useAccountStore.getState().isVIPMode).toBe(false);
  });

  it('keeps the last plan answer when the BE cannot be read, but still takes the wallet', async () => {
    useAccountStore.setState({ isVIPMode: true, subscription: plan('ACTIVE', '2999-01-01T00:00:00.000Z') as never });
    routeFetch({ 'GET /wallet': { body: { mainBalance: 3, bonusBalance: 1 } }, 'GET /subscriptions/me': { status: 500, body: {} } });

    await useAccountStore.getState().loadAccountData();

    expect(useAccountStore.getState()).toMatchObject({ wallet: { mainCoin: 3, bonusCoin: 1 }, isVIPMode: true });
  });

  it('sets the balances an unlock or a spin answered, and forgets everything on reset', () => {
    useAccountStore.getState().setWalletBalance(12, 4);
    expect(useAccountStore.getState().wallet).toEqual({ mainCoin: 12, bonusCoin: 4 });

    useAccountStore.setState({ isVIPMode: true });
    useAccountStore.getState().reset();
    expect(useAccountStore.getState()).toMatchObject({ wallet: { mainCoin: 0, bonusCoin: 0 }, isVIPMode: false, subscription: null, dailyReward: null });
  });

  it('reports a check-in the BE refused without touching the wallet', async () => {
    useAccountStore.getState().setWalletBalance(9, 9);
    routeFetch({ 'POST /daily-rewards/check-in': { status: 409, body: { error: { message: 'Hôm nay đã điểm danh' } } } });

    const res = await useAccountStore.getState().claimDailyCheckIn();

    expect(res).toEqual({ success: false, error: 'Hôm nay đã điểm danh' });
    expect(useAccountStore.getState().wallet).toEqual({ mainCoin: 9, bonusCoin: 9 });
  });

  it('persists only the plan flag, never the wallet', async () => {
    useAccountStore.setState({ isVIPMode: true, wallet: { mainCoin: 50, bonusCoin: 5 } });
    await new Promise((resolve) => setTimeout(resolve, 0));

    const saved = JSON.parse(String(await AsyncStorage.getItem('ai_cinema_mobile_account_store')));
    expect(saved.state).toEqual({ isVIPMode: true });
  });
});

describe('catalog store', () => {
  it('reads the catalog and opens on its first movie', async () => {
    const fetchMock = routeFetch({ 'GET /movies': { body: [{ id: 'm1', title: 'A' }, { id: 'm2', title: 'B' }] } });

    await useCatalogStore.getState().loadCatalog();

    expect(useCatalogStore.getState().movies.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(useCatalogStore.getState().currentMovie?.id).toBe('m1');
    expect(String(fetchMock.mock.calls[0][0])).toContain('limit=50');
  });

  it('shows no movies instead of samples when the BE is unreachable', async () => {
    useCatalogStore.setState({ movies: [movie('old')] });
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));

    await useCatalogStore.getState().loadCatalog();

    expect(useCatalogStore.getState()).toMatchObject({ movies: [], currentMovie: null });
  });

  it('flags only the episode the BE granted', () => {
    useCatalogStore.getState().setCurrentMovie(movie('m1', [{ id: 'e1', isUnlocked: false }, { id: 'e2', isUnlocked: false }]));

    useCatalogStore.getState().markEpisodeUnlocked('e2');

    expect(useCatalogStore.getState().currentMovie?.episodes.map((ep) => ep.isUnlocked)).toEqual([false, true]);
  });

  it('ignores an unlock with no movie open', () => {
    useCatalogStore.getState().markEpisodeUnlocked('e1');
    expect(useCatalogStore.getState().currentMovie).toBeNull();
  });
});

describe('ui store', () => {
  it('opens the sign-in sheet in the asked mode with a prefilled email', () => {
    useUiStore.getState().openAuthModal('register', 'a@b.c');
    expect(useUiStore.getState()).toMatchObject({ isAuthModalOpen: true, authModalMode: 'register', initialAuthEmail: 'a@b.c' });

    useUiStore.getState().closeAuthModal();
    expect(useUiStore.getState().isAuthModalOpen).toBe(false);

    useUiStore.getState().openAuthModal();
    expect(useUiStore.getState()).toMatchObject({ authModalMode: 'login', initialAuthEmail: '' });
  });

  it('reads the check-in ladder again each time the sheet opens, not when it closes', () => {
    const original = useAccountStore.getState().loadDailyReward;
    const load = jest.fn(async () => true);
    useAccountStore.setState({ loadDailyReward: load });

    useUiStore.getState().setCheckInModalOpen(true);
    useUiStore.getState().setCheckInModalOpen(false);

    expect(load).toHaveBeenCalledTimes(1);
    expect(useUiStore.getState().isCheckInModalOpen).toBe(false);
    useAccountStore.setState({ loadDailyReward: original });
  });

  it('toggles the spin and top-up sheets', () => {
    useUiStore.getState().setRewardSpinOpen(true);
    useUiStore.getState().setTopUpModalOpen(true);
    expect(useUiStore.getState()).toMatchObject({ isRewardSpinOpen: true, isTopUpModalOpen: true });
  });
});

describe('start-up', () => {
  it('a guest reads only the catalog', async () => {
    const fetchMock = routeFetch({ 'GET /movies': { body: [{ id: 'm1', title: 'A' }] } });

    await loadInitialData();

    expect(calledPaths(fetchMock)).toEqual(['GET /movies']);
  });

  it('a member is confirmed with the BE and the account is read', async () => {
    useSessionStore.setState({ isAuthenticated: true, user: { id: 'u1', name: 'Cũ', email: 'a@b.c', role: 'user', isVIP: false, avatarUrl: '', createdAt: '' } });
    await apiClient.saveSession({ accessToken: 'a' });
    const fetchMock = routeFetch({
      'GET /movies': { body: [] },
      'GET /auth/me': { body: { id: 'u1', fullName: 'Mới', email: 'a@b.c', role: 'MEMBER' } },
      'GET /wallet': { body: { mainBalance: 8, bonusBalance: 2 } },
      'GET /subscriptions/me': { body: null },
    });

    await loadInitialData();

    expect(calledPaths(fetchMock).sort()).toEqual(['GET /auth/me', 'GET /movies', 'GET /subscriptions/me', 'GET /wallet']);
    expect(useSessionStore.getState().user?.name).toBe('Mới');
    expect(useAccountStore.getState().wallet).toEqual({ mainCoin: 8, bonusCoin: 2 });
  });

  it('a session the BE no longer knows is signed out with its account', async () => {
    useSessionStore.setState({ isAuthenticated: true });
    useAccountStore.setState({ isVIPMode: true, wallet: { mainCoin: 5, bonusCoin: 5 } });
    routeFetch({ 'GET /movies': { body: [] }, 'GET /auth/me': { status: 401, body: {} } });

    await loadInitialData();

    expect(useSessionStore.getState()).toMatchObject({ isAuthenticated: false, user: null });
    expect(useAccountStore.getState()).toMatchObject({ isVIPMode: false, wallet: { mainCoin: 0, bonusCoin: 0 } });
  });

  it('keeps the member signed in when the BE is only unreachable', async () => {
    useSessionStore.setState({ isAuthenticated: true });
    routeFetch({ 'GET /movies': { body: [] }, 'GET /auth/me': { status: 503, body: {} } });

    await loadInitialData();

    expect(useSessionStore.getState().isAuthenticated).toBe(true);
  });
});
