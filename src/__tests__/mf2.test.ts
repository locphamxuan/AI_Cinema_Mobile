import { episodeAccessService, rewardService, walletService } from '../services';
import { idempotencyKey } from '../lib/ids';
import { planIsRunning, useAppStore } from '../store/useAppStore';
import { splitPrice } from '../components/player/UnlockEpisodeModal';
import { ladderDays } from '../components/wallet/CheckInModal';
import { coinsFor } from '../components/wallet/TopUpModal';
import { cancelWindowText } from '../../app/(tabs)/vip';
import type { DailyRewardStatus, MySubscription } from '../types/episodeAccess';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

/** Answers each fetch by `METHOD path` (without the /api prefix) and records the calls. */
function routeFetch(routes: Record<string, unknown>) {
  return jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
    const path = new URL(String(input), 'http://x').pathname.replace(/^\/api/, '');
    const key = `${init?.method ?? 'GET'} ${path}`;
    const known = key in routes;
    return {
      ok: known,
      status: known ? 200 : 404,
      text: async () => JSON.stringify(routes[key] ?? { message: 'not found' }),
      json: async () => routes[key],
    } as Response;
  });
}

const headerOf = (init: RequestInit | undefined, name: string) => (init?.headers as Record<string, string>)[name];

const plan = (status: MySubscription['status'], end: string, extra: Partial<MySubscription> = {}): MySubscription => ({
  id: 'sub-1',
  status,
  autoRenew: true,
  priceCoins: 900,
  currentPeriodStart: '2026-10-01T00:00:00.000Z',
  currentPeriodEnd: end,
  nextRenewalAt: end,
  cancelDeadline: null,
  plan: { id: 'p', code: 'MONTHLY', name: 'Gói Tháng', durationDays: 30 },
  ...extra,
});

afterEach(() => jest.restoreAllMocks());

describe('MF-2 rules on the client', () => {
  it('pays main Coins first and covers the rest with bonus Coins', () => {
    expect(splitPrice(10, 7)).toEqual({ main: 7, bonus: 3 });
    expect(splitPrice(10, 25)).toEqual({ main: 10, bonus: 0 });
  });

  it('buys main Coins at the Admin rate, rounding down like the BE', () => {
    expect(coinsFor(50500, 1000)).toBe(50);
    expect(coinsFor(999, 1000)).toBe(0);
  });

  it('opens every episode only while the plan is ACTIVE and paid for', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(planIsRunning(plan('ACTIVE', future))).toBe(true);
    expect(planIsRunning(plan('PAST_DUE', future))).toBe(false);
    expect(planIsRunning(plan('ACTIVE', '2000-01-01T00:00:00.000Z'))).toBe(false);
    expect(planIsRunning(null)).toBe(false);
  });

  it('says which side of the cancel deadline the member is on (BR-30)', () => {
    const now = Date.parse('2026-10-10T00:00:00.000Z');
    const before = plan('ACTIVE', '2026-10-31T00:00:00.000Z', { cancelDeadline: '2026-10-30T00:00:00.000Z' });
    const after = plan('ACTIVE', '2026-10-31T00:00:00.000Z', { cancelDeadline: '2026-10-09T00:00:00.000Z' });
    expect(cancelWindowText(before, now)).toContain('còn tắt được');
    expect(cancelWindowText(after, now)).toContain('Đã quá hạn');
    expect(cancelWindowText({ ...before, autoRenew: false }, now)).toContain('Đã tắt tự gia hạn');
  });

  it('lays the BE ladder out over seven days, the milestone granting a spin', () => {
    const status = {
      checkedInToday: false,
      streakDay: 2,
      ladder: [
        { streakDay: 1, bonusCoins: 5, grantsSpin: false },
        { streakDay: 7, bonusCoins: 20, grantsSpin: true },
      ],
    } as DailyRewardStatus;
    const days = ladderDays(status);
    expect(days.map((d) => d.state)).toEqual(['claimed', 'claimed', 'next', 'locked', 'locked', 'locked', 'locked']);
    expect(days[6]).toMatchObject({ bonusCoins: 20, grantsSpin: true });
    expect(ladderDays(status, 3)[2].state).toBe('claimed');
  });

  it('makes a distinct idempotency key per action', () => {
    expect(idempotencyKey('ep-')).toMatch(/^ep-/);
    expect(idempotencyKey('ep-')).not.toBe(idempotencyKey('ep-'));
  });
});

describe('MF-2 services call the BE contract', () => {
  it('buys an episode once per key', async () => {
    const fetchMock = routeFetch({ 'POST /episodes/ep-1/purchase': { paidCoins: 10, mainBalance: 0, bonusBalance: 0 } });
    await episodeAccessService.purchaseEpisode('ep-1', 'k1');
    expect(headerOf(fetchMock.mock.calls[0][1], 'Idempotency-Key')).toBe('k1');
  });

  it('joins a plan by quoting then paying the quoted intent', async () => {
    const fetchMock = routeFetch({
      'POST /subscriptions': { id: 'sub-9', status: 'PENDING' },
      'POST /subscriptions/sub-9/activate': { id: 'sub-9', status: 'ACTIVE', mainBalance: 0, bonusBalance: 0 },
    });
    const res = await episodeAccessService.joinPlan('plan-m', 'k');
    expect(res.success).toBe(true);
    expect(fetchMock.mock.calls.map(([url]) => new URL(String(url), 'http://x').pathname.replace(/^\/api/, ''))).toEqual([
      '/subscriptions',
      '/subscriptions/sub-9/activate',
    ]);
    expect(headerOf(fetchMock.mock.calls[1][1], 'Idempotency-Key')).toBe('k:pay');
  });

  it('checks in and refreshes the ladder and the wallet from the BE', async () => {
    routeFetch({
      'POST /daily-rewards/check-in': { streakDay: 1, bonusGranted: 5, spinGranted: false, mainBalance: 0, bonusBalance: 5 },
      'GET /daily-rewards/status': {
        checkedInToday: true,
        streakDay: 1,
        ladder: [],
        availableSpins: 0,
        reward: { bonusCoins: 0, grantsSpin: false },
        mainBalance: 0,
        bonusBalance: 5,
      },
    });
    const res = await useAppStore.getState().claimDailyCheckIn();
    expect(res.success).toBe(true);
    expect(useAppStore.getState().wallet).toEqual({ mainCoin: 0, bonusCoin: 5 });
    expect(useAppStore.getState().dailyReward?.checkedInToday).toBe(true);
  });

  it('reads the wheel and the Coin history from their own routes', async () => {
    const fetchMock = routeFetch({ 'GET /rewards/spins': { availableSpins: 0, prizes: [], history: [] }, 'GET /wallet/statements': [] });
    await rewardService.getWheel();
    await walletService.getStatements(2, 'TOP_UP');
    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls[0]).toMatch(/\/rewards\/spins$/);
    expect(urls[1]).toMatch(/\/wallet\/statements\?page=2&limit=20&entryType=TOP_UP$/);
  });
});
