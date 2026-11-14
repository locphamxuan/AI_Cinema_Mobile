import { useAccountStore, useSessionStore, useUiStore } from '../store';
import { apiClient } from '../services/apiClient';
import { storage, STORAGE_KEYS } from '../lib/storage';

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

const session = (role: string) => ({
  body: {
    accessToken: 'access',
    refreshToken: 'r'.repeat(30),
    user: { id: 'u1', email: 'viewer@example.com', fullName: 'Viewer', role },
  },
});

const runningPlan = {
  id: 'sub-1',
  status: 'ACTIVE',
  autoRenew: true,
  priceCoins: 900,
  currentPeriodStart: '2026-10-01T00:00:00.000Z',
  currentPeriodEnd: '2999-01-01T00:00:00.000Z',
  nextRenewalAt: null,
  cancelDeadline: null,
  plan: { id: 'p', code: 'MONTHLY', name: 'Gói Tháng', durationDays: 30 },
};

const signedOut = {
  isAuthenticated: false,
  user: null,
  isVIPMode: false,
  wallet: { mainCoin: 0, bonusCoin: 0 },
  subscription: null,
  dailyReward: null,
};

/** The account as the screens see it, across the session and account stores. */
const appState = () => ({ ...useSessionStore.getState(), ...useAccountStore.getState() });

function setAppState(state: Partial<typeof signedOut>) {
  const { isAuthenticated, user, ...account } = state;
  useSessionStore.setState({ ...(isAuthenticated !== undefined && { isAuthenticated }), ...(user !== undefined && { user }) });
  useAccountStore.setState(account);
}

beforeEach(() => setAppState(signedOut));

afterEach(async () => {
  jest.restoreAllMocks();
  await apiClient.clearSession();
});

describe('sign-in on the store', () => {
  it('opens a member session and reads the wallet and plan from the BE', async () => {
    routeFetch({
      'POST /auth/login': session('MEMBER'),
      'GET /wallet': { body: { mainBalance: 120, bonusBalance: 30 } },
      'GET /subscriptions/me': { body: runningPlan },
    });

    useUiStore.getState().openAuthModal('login');

    const res = await useSessionStore.getState().login(' Viewer@Example.com ', 'password123');

    const state = appState();
    expect(res.success).toBe(true);
    expect(state.isAuthenticated).toBe(true);
    expect(state.wallet).toEqual({ mainCoin: 120, bonusCoin: 30 });
    expect(state.isVIPMode).toBe(true);
    expect(useUiStore.getState().isAuthModalOpen).toBe(false);
    expect(await storage.getString(STORAGE_KEYS.AUTH_TOKEN, '')).toBe('access');
  });

  it('turns a studio account away to the Studio Web and stays signed out', async () => {
    const fetchMock = routeFetch({ 'POST /auth/login': session('STUDIO'), 'POST /auth/logout': { status: 204 } });

    const res = await useSessionStore.getState().login('studio@example.com', 'password123');

    expect(res.success).toBe(false);
    expect(res.error).toContain('Studio Web');
    expect(appState().isAuthenticated).toBe(false);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringContaining('/auth/login'),
      expect.stringContaining('/auth/logout'),
    ]);
  });

  it('reports a network failure in words the viewer can act on', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network request failed'));

    const res = await useSessionStore.getState().login('viewer@example.com', 'password123');

    expect(res).toEqual({ success: false, error: 'Network request failed' });
    expect(appState().isAuthenticated).toBe(false);
  });
});

describe('sign-up on the store', () => {
  it('asks for the birthday before calling the BE', async () => {
    const fetchMock = jest.spyOn(global, 'fetch');

    const res = await useSessionStore.getState().register('Viewer', 'viewer@example.com', 'password123', '  ');

    expect(res.success).toBe(false);
    expect(res.error).toContain('ngày sinh');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the birthday and signs the new member in', async () => {
    const fetchMock = routeFetch({
      'POST /auth/register': session('MEMBER'),
      'GET /wallet': { body: { mainBalance: 0, bonusBalance: 0 } },
      'GET /subscriptions/me': { body: null },
    });

    const res = await useSessionStore.getState().register(' Viewer ', 'Viewer@Example.com', 'password123', '2000-01-31');

    expect(res.success).toBe(true);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      email: 'viewer@example.com',
      password: 'password123',
      fullName: 'Viewer',
      dateOfBirth: '2000-01-31',
    });
    expect(appState().isAuthenticated).toBe(true);
    expect(appState().isVIPMode).toBe(false);
  });
});

describe('leaving the session', () => {
  it('logout forgets the wallet and plan of the account', async () => {
    setAppState({ isAuthenticated: true, isVIPMode: true, wallet: { mainCoin: 5, bonusCoin: 5 } });
    routeFetch({ 'POST /auth/logout': { status: 204 } });

    await useSessionStore.getState().logout();

    expect(appState()).toMatchObject(signedOut);
  });

  it('signs out every screen when the BE rejects the refresh token', async () => {
    setAppState({ isAuthenticated: true, wallet: { mainCoin: 5, bonusCoin: 0 } });
    await apiClient.saveSession({ accessToken: 'old', refreshToken: 'r'.repeat(30) });
    routeFetch({ 'GET /wallet': { status: 401, body: {} }, 'POST /auth/refresh': { status: 401, body: {} } });

    await apiClient.get('/wallet');

    expect(appState()).toMatchObject(signedOut);
  });
});
