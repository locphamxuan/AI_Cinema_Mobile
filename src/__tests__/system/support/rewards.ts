/** Daily check-in and lucky wheel answers of the BE. */
import { act } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';

export const ladder = [1, 2, 3, 4, 5, 6, 7].map((day) => ({ streakDay: day, bonusCoins: day === 7 ? 50 : 10, grantsSpin: day === 7 }));

export const dailyStatus = (overrides: Record<string, unknown> = {}) => ({
  checkInDate: '2026-11-24',
  checkedInToday: false,
  streakDay: 6,
  streakContinued: true,
  reward: { bonusCoins: 50, grantsSpin: true },
  ladder,
  availableSpins: 0,
  mainBalance: 20,
  bonusBalance: 60,
  ...overrides,
});

export const prizes = [
  { id: 'pr-20', code: 'bonus_20', name: '20 Coin thưởng', type: 'BONUS_COIN', bonusCoins: 20, planDays: null, chancePercent: 70 },
  { id: 'pr-50', code: 'bonus_50', name: '50 Coin thưởng', type: 'BONUS_COIN', bonusCoins: 50, planDays: null, chancePercent: 28 },
  { id: 'pr-30d', code: 'plan_30', name: 'Gói Tháng 30 ngày', type: 'PLAN_DAYS', bonusCoins: null, planDays: 30, chancePercent: 2 },
];

export const wheel = (availableSpins: number) => ({ availableSpins, prizes, history: [] });

export const spinResult = (prizeIndex: number, overrides: Record<string, unknown> = {}) => {
  const prize = prizes[prizeIndex];
  return {
    id: 'spin-1',
    status: 'USED',
    grantedAt: '2026-11-24T00:00:00.000Z',
    spunAt: '2026-11-24T08:00:00.000Z',
    prize: { id: prize.id, name: prize.name, type: prize.type, bonusCoins: prize.bonusCoins, planDays: prize.planDays },
    bonusCoins: prize.bonusCoins,
    planDays: prize.planDays,
    planActiveUntil: null,
    mainBalance: 20,
    bonusBalance: 60 + (prize.bonusCoins ?? 0),
    availableSpins: 0,
    ...overrides,
  };
};

/** Short spins: the member asked for less motion, so the wheel settles in 0.4 s. */
export const reduceMotion = () => jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
export const waitForSpin = () => act(() => new Promise((resolve) => setTimeout(resolve, 700)));

/** Where the wheel animation is told to stop, in degrees (the native driver turns it, not JS). */
export function watchLanding() {
  const timing = jest.spyOn(Animated, 'timing');
  // Buttons fade with short timings too; the wheel's turn lasts 0.4 s (less motion) or 4.2 s.
  return () => {
    const spin = timing.mock.calls.map(([, config]) => config as { toValue: number; duration?: number }).filter((c) => c.duration === 400 || c.duration === 4200);
    return spin.length ? spin[spin.length - 1].toValue : Number.NaN;
  };
}
