import React from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { RewardSpinModal, prizeLabel } from '../components/wallet/RewardSpinModal';
import { rewardService } from '../services/rewardService';
import { useUiStore } from '../store';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../services/rewardService', () => ({ rewardService: { getWheel: jest.fn(), spin: jest.fn() } }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const prizes = [
  { id: 'a', code: 'bonus_20', name: '20 Coin', type: 'BONUS_COIN' as const, bonusCoins: 20, planDays: null, chancePercent: 98 },
  { id: 'b', code: 'plan_30', name: '30 ngày', type: 'PLAN_DAYS' as const, bonusCoins: null, planDays: 30, chancePercent: 2 },
];

let tree: ReactTestRenderer;
const texts = () => tree.root.findAllByType(Text).map((t) => [t.props.children].flat().join(''));

afterEach(() => act(() => tree?.unmount()));

describe('reward wheel preview (BR-09)', () => {
  it('labels a prize with the chance the BE sends, and without a percent when there is none', () => {
    expect(prizeLabel(prizes[0])).toBe('+20 Coin thưởng (98%)');
    expect(prizeLabel(prizes[1])).toBe('Gói Tháng 30 ngày (2%)');
    expect(prizeLabel({ ...prizes[0], chancePercent: undefined })).toBe('+20 Coin thưởng');
  });

  it('shows the prizes to a member with no spin, but will not spin', async () => {
    jest.mocked(rewardService.getWheel).mockResolvedValue({ success: true, data: { availableSpins: 0, prizes, history: [] } } as never);
    act(() => useUiStore.setState({ isRewardSpinOpen: true } as never));
    await act(async () => {
      tree = create(<RewardSpinModal />);
    });

    expect(texts()).toEqual(expect.arrayContaining(['+20 Coin thưởng (98%)', 'Gói Tháng 30 ngày (2%)']));
    expect(texts().some((t) => t.includes('Bạn đang xem trước vòng quay'))).toBe(true);
    const button = tree.root.find((n) => n.props.accessibilityLabel === 'Chưa có lượt quay' && typeof n.props.onPress === 'function');
    expect(button.props.disabled).toBe(true);
    expect(rewardService.spin).not.toHaveBeenCalled();
  });
});
