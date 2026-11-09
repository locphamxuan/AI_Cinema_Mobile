import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../services/apiClient';
import { storage, STORAGE_KEYS } from '../lib/storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

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

beforeEach(() => useAppStore.setState(signedOut));

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

    const res = await useAppStore.getState().login(' Viewer@Example.com ', 'password123');

    const state = useAppStore.getState();
    expect(res.success).toBe(true);
    expect(state.isAuthenticated).toBe(true);
    expect(state.wallet).toEqual({ mainCoin: 120, bonusCoin: 30 });
    expect(state.isVIPMode).toBe(true);
    expect(state.user?.isVIP).toBe(true);
    expect(await storage.getString(STORAGE_KEYS.AUTH_TOKEN, '')).toBe('access');
  });

  it('turns a studio account away to the Studio Web and stays signed out', async () => {
    const fetchMock = routeFetch({ 'POST /auth/login': session('STUDIO'), 'POST /auth/logout': { status: 204 } });

    const res = await useAppStore.getState().login('studio@example.com', 'password123');

    expect(res.success).toBe(false);
    expect(res.error).toContain('Studio Web');
    expect(useAppStore.getState().isAuthenticated).toBe(false);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringContaining('/auth/login'),
      expect.stringContaining('/auth/logout'),
    ]);
  });

  it('reports a network failure in words the viewer can act on', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network request failed'));

    const res = await useAppStore.getState().login('viewer@example.com', 'password123');

    expect(res).toEqual({ success: false, error: 'Network request failed' });
    expect(useAppStore.getState().isAuthenticated).toBe(false);
  });
});

describe('sign-up on the store', () => {
  it('asks for the birthday before calling the BE', async () => {
    const fetchMock = jest.spyOn(global, 'fetch');

    const res = await useAppStore.getState().register('Viewer', 'viewer@example.com', 'password123', '  ');

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

    const res = await useAppStore.getState().register(' Viewer ', 'Viewer@Example.com', 'password123', '2000-01-31');

    expect(res.success).toBe(true);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      email: 'viewer@example.com',
      password: 'password123',
      fullName: 'Viewer',
      dateOfBirth: '2000-01-31',
    });
    expect(useAppStore.getState().isAuthenticated).toBe(true);
    expect(useAppStore.getState().isVIPMode).toBe(false);
  });
});

describe('leaving the session', () => {
  it('logout forgets the wallet and plan of the account', async () => {
    useAppStore.setState({ isAuthenticated: true, isVIPMode: true, wallet: { mainCoin: 5, bonusCoin: 5 } });
    routeFetch({ 'POST /auth/logout': { status: 204 } });

    await useAppStore.getState().logout();

    expect(useAppStore.getState()).toMatchObject(signedOut);
  });

  it('signs out every screen when the BE rejects the refresh token', async () => {
    useAppStore.setState({ isAuthenticated: true, wallet: { mainCoin: 5, bonusCoin: 0 } });
    await apiClient.saveSession({ accessToken: 'old', refreshToken: 'r'.repeat(30) });
    routeFetch({ 'GET /wallet': { status: 401, body: {} }, 'POST /auth/refresh': { status: 401, body: {} } });

    await apiClient.get('/wallet');

    expect(useAppStore.getState()).toMatchObject(signedOut);
  });
});
