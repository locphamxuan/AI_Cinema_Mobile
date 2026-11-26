import React from 'react';
import { Animated, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { RewardSpinModal, prizeIndexOf, prizeLabel } from '../components/wallet/RewardSpinModal';
import {
  landingRotation,
  segmentAtPointer,
  segmentColorIndexes,
  segmentLabel,
} from '../components/wallet/luckyWheelMath';
import { rewardService } from '../services/rewardService';
import { useUiStore } from '../store';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../services/rewardService', () => ({ rewardService: { getWheel: jest.fn(), spin: jest.fn() } }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const prizes = [
  { id: 'a', code: 'bonus_20', name: '20 Coin', type: 'BONUS_COIN' as const, bonusCoins: 20, planDays: null, chancePercent: 98 },
  { id: 'b', code: 'plan_30', name: '30 ngày', type: 'PLAN_DAYS' as const, bonusCoins: null, planDays: 30, chancePercent: 2 },
];

let tree: ReactTestRenderer;
const texts = () => tree.root.findAllByType(Text).map((t) => [t.props.children].flat().join(''));
const hub = (label: string) =>
  tree.root.find((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function');

const open = async () => {
  act(() => useUiStore.setState({ isRewardSpinOpen: true } as never));
  await act(async () => {
    tree = create(<RewardSpinModal />);
  });
};

afterEach(() => {
  act(() => tree?.unmount());
  jest.restoreAllMocks();
});

describe('lucky wheel geometry (BR-09)', () => {
  it('lands every prize under the top pointer after the full turns', () => {
    for (const count of [1, 2, 3, 7, 12]) {
      for (let index = 0; index < count; index += 1) {
        const end = landingRotation(123, index, count, 5, 0.3);
        expect(end - 123).toBeGreaterThanOrEqual(5 * 360);
        expect(segmentAtPointer(end, count)).toBe(index);
      }
    }
  });

  it('turns only a little when motion is reduced', () => {
    const end = landingRotation(90, 1, 4, 0);
    expect(end - 90).toBeLessThan(360);
    expect(segmentAtPointer(end, 4)).toBe(1);
  });

  it('never paints two touching segments the same colour', () => {
    for (const count of [3, 4, 5, 9, 13]) {
      const colors = segmentColorIndexes(count, 4);
      colors.forEach((c, i) => expect(c).not.toBe(colors[(i + 1) % count]));
    }
  });

  it('writes a short label on each segment', () => {
    expect(segmentLabel(prizes[0])).toBe('20 Coin');
    expect(segmentLabel(prizes[1])).toBe('30 ngày');
  });

  it('finds the won prize by id, or by what it pays once deleted', () => {
    expect(prizeIndexOf(prizes, { id: 'b', name: 'x', type: 'PLAN_DAYS', bonusCoins: null, planDays: 30 })).toBe(1);
    expect(prizeIndexOf(prizes, { id: null, name: 'x', type: 'BONUS_COIN', bonusCoins: 20, planDays: null })).toBe(0);
  });
});

describe('reward wheel preview (BR-09)', () => {
  it('labels a prize with the chance the BE sends, and without a percent when there is none', () => {
    expect(prizeLabel(prizes[0])).toBe('+20 Coin thưởng (98%)');
    expect(prizeLabel(prizes[1])).toBe('Gói Tháng 30 ngày (2%)');
    expect(prizeLabel({ ...prizes[0], chancePercent: undefined })).toBe('+20 Coin thưởng');
  });

  it('shows the prizes on the wheel to a member with no spin, but the centre button stays locked', async () => {
    jest.mocked(rewardService.getWheel).mockResolvedValue({ success: true, data: { availableSpins: 0, prizes, history: [] } } as never);
    await open();

    expect(texts()).toEqual(expect.arrayContaining(['+20 Coin thưởng (98%)', 'Gói Tháng 30 ngày (2%)', '20 Coin', '30 ngày', 'Quay']));
    expect(texts().some((t) => t.includes('Bạn đang xem trước vòng quay'))).toBe(true);
    const button = hub('Chưa có lượt quay');
    expect(button.props.disabled).toBe(true);
    expect(button.props.accessibilityHint).toMatch(/xem trước/);
    expect(tree.root.findAll((n) => n.props.accessibilityLabel === 'Vòng quay có 2 giải: 20 Coin, 30 ngày').length).toBeGreaterThan(0);
    expect(rewardService.spin).not.toHaveBeenCalled();
  });

  it('spins with an Idempotency-Key and stops on the prize the BE drew', async () => {
    jest.mocked(rewardService.getWheel).mockResolvedValue({ success: true, data: { availableSpins: 1, prizes, history: [] } } as never);
    jest.mocked(rewardService.spin).mockResolvedValue({
      success: true,
      data: {
        id: 's1',
        status: 'USED',
        grantedAt: '2026-11-22T00:00:00Z',
        spunAt: '2026-11-22T00:00:01Z',
        prize: { id: 'b', name: '30 ngày', type: 'PLAN_DAYS', bonusCoins: null, planDays: 30 },
        bonusCoins: null,
        planDays: 30,
        planActiveUntil: null,
        mainBalance: 0,
        bonusBalance: 0,
        availableSpins: 0,
      },
    } as never);
    let toValue = -1;
    jest.spyOn(Animated, 'timing').mockImplementation((_value, config) => {
      toValue = config.toValue as number;
      return { start: (done?: (result: { finished: boolean }) => void) => done?.({ finished: true }), stop: jest.fn(), reset: jest.fn() };
    });
    await open();

    await act(async () => {
      hub('Quay (còn 1 lượt)').props.onPress();
    });

    expect(rewardService.spin).toHaveBeenCalledWith(expect.stringMatching(/^spin-/));
    expect(segmentAtPointer(toValue, prizes.length)).toBe(1);
    expect(texts()).toContain('Bạn trúng 30 ngày');
  });
});
