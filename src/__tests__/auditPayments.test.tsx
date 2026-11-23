import React from 'react';
import { Text, TextInput } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { UnlockEpisodeModal } from '../components/player/UnlockEpisodeModal';
import { RewardSpinModal } from '../components/wallet/RewardSpinModal';
import { TopUpModal } from '../components/wallet/TopUpModal';
import { CheckInModal } from '../components/wallet/CheckInModal';
import { Button } from '../components/common/Button';
import { episodeAccessService } from '../services/episodeAccessService';
import { walletService } from '../services/walletService';
import { rewardService } from '../services/rewardService';
import { useUiStore } from '../store';
import type { ApiResponse } from '../types/api';
import type { AccessDecision } from '../types/episodeAccess';
import type { Episode } from '../types/movie';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }: { children?: React.ReactNode }) => children ?? null }));
jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn(async () => ({ type: 'success' })), openBrowserAsync: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../services/rewardService', () => ({
  rewardService: { getWheel: jest.fn(), spin: jest.fn(), getDailyStatus: jest.fn(), checkIn: jest.fn() },
}));
jest.setTimeout(60_000);
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ok = <T,>(data: T): ApiResponse<T> => ({ success: true, data, statusCode: 200 });
const refused = (statusCode: number, reason: string, message: string): ApiResponse<never> =>
  ({ success: false, data: null, statusCode, reason, message }) as unknown as ApiResponse<never>;
/** Resolves only when the test says so, so a second tap lands while the first call is still open. */
const deferred = <T,>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

let tree: ReactTestRenderer;
const texts = () => tree.root.findAllByType(Text).map((t) => [t.props.children].flat().join(''));
const button = (label: RegExp) => tree.root.findAllByType(Button).find((b) => label.test(b.props.label))!;

afterEach(() => {
  act(() => tree?.unmount());
  jest.restoreAllMocks();
  jest.clearAllMocks();
  useUiStore.setState({ isTopUpModalOpen: false, isRewardSpinOpen: false, isCheckInModalOpen: false, pendingPurchase: null } as never);
});

const episode = { id: 'ep-3', episodeNumber: 3, title: 'Tập 3', availability: 'AVAILABLE' } as Episode;
const decision = {
  accessGranted: false,
  nextAction: 'UNLOCK_EPISODE',
  accessMethods: ['UNLOCK_EPISODE'],
  required: { coinPrice: 10, mainBalance: 6, bonusBalance: 5, enoughCoins: true, missingCoins: 0 },
} as AccessDecision;

const renderUnlock = async (onUnlocked = jest.fn()) => {
  await act(async () => {
    tree = create(<UnlockEpisodeModal locked={{ episode, decision }} onClose={jest.fn()} onUnlocked={onUnlocked} />);
  });
  return onUnlocked;
};

describe('unlock episode refusals (BR-01)', () => {
  it('plays an episode the BE says is already owned, without an error', async () => {
    jest.spyOn(episodeAccessService, 'purchaseEpisode').mockResolvedValue(refused(409, 'ACCESS_ALREADY_OWNED', 'Tập đã mở'));
    jest.spyOn(episodeAccessService, 'listOwnedEpisodeIds').mockResolvedValue(ok(['ep-3']));
    const onUnlocked = await renderUnlock();
    await act(async () => button(/^Mở khóa với 10 Coin$/).props.onPress());
    expect(onUnlocked).toHaveBeenCalledWith(episode);
  });

  it('turns to topping up when the wallet ran short since the quote', async () => {
    jest.spyOn(episodeAccessService, 'purchaseEpisode').mockResolvedValue(refused(422, 'INSUFFICIENT_COINS', 'Ví không đủ'));
    const onUnlocked = await renderUnlock();
    await act(async () => button(/^Mở khóa với 10 Coin$/).props.onPress());
    expect(onUnlocked).not.toHaveBeenCalled();
    expect(button(/^Nạp Coin$/)).toBeDefined();
    expect(texts().some((t) => t.includes('chưa có Coin nào bị trừ'))).toBe(true);
  });
});

describe('paying actions send once on a double tap', () => {
  it('creates one VNPay order', async () => {
    jest.spyOn(walletService, 'getTopUpOptions').mockResolvedValue(ok({ rateVnd: 1000, minVnd: 10_000, maxVnd: 5_000_000 }));
    const pending = deferred<ApiResponse<never>>();
    const create$ = jest.spyOn(walletService, 'createTopUp').mockReturnValue(pending.promise);
    act(() => useUiStore.setState({ isTopUpModalOpen: true } as never));
    await act(async () => {
      tree = create(<TopUpModal />);
    });
    await act(async () => tree.root.findByType(TextInput).props.onChangeText('10000'));
    const pay = button(/^Thanh toán 10\.000đ$/).props.onPress;
    await act(async () => {
      void pay();
      void pay();
    });
    expect(create$).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve(refused(503, 'GATEWAY_UNREACHABLE', 'x')));
    expect(texts().some((t) => t.includes('chưa kết nối được VNPay'))).toBe(true);
    expect(texts().some((t) => /Google/.test(t))).toBe(false);
  });

  it('uses one spin, and forgets the key after a final refusal', async () => {
    const prizes = [{ id: 'a', code: 'c', name: '20 Coin', type: 'BONUS_COIN' as const, bonusCoins: 20, planDays: null, chancePercent: 100 }];
    jest.mocked(rewardService.getWheel).mockResolvedValue(ok({ availableSpins: 1, prizes, history: [] } as never));
    const pending = deferred<ApiResponse<never>>();
    jest.mocked(rewardService.spin).mockReturnValue(pending.promise);
    act(() => useUiStore.setState({ isRewardSpinOpen: true } as never));
    await act(async () => {
      tree = create(<RewardSpinModal />);
    });
    const spin = tree.root.find((n) => n.props.accessibilityLabel === 'Quay (còn 1 lượt)' && typeof n.props.onPress === 'function').props.onPress;
    await act(async () => {
      void spin();
      void spin();
    });
    expect(rewardService.spin).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve(refused(422, 'NO_SPIN_AVAILABLE', 'Bạn không còn lượt quay.')));
    // Not stuck on "Xem kết quả": the wheel was read again from the BE.
    expect(rewardService.getWheel).toHaveBeenCalledTimes(2);
    expect(tree.root.findAll((n) => n.props.accessibilityLabel === 'Xem kết quả').length).toBe(0);
  });

  it('checks in once and rereads the day when the BE refuses (BR-08)', async () => {
    const status = {
      checkedInToday: false,
      streakDay: 0,
      reward: { bonusCoins: 5 },
      ladder: [{ streakDay: 1, bonusCoins: 5, grantsSpin: false }],
      availableSpins: 0,
      mainBalance: 0,
      bonusBalance: 0,
    };
    jest.mocked(rewardService.getDailyStatus).mockResolvedValue(ok(status as never));
    const pending = deferred<ApiResponse<never>>();
    jest.mocked(rewardService.checkIn).mockReturnValue(pending.promise);
    act(() => useUiStore.setState({ isCheckInModalOpen: true } as never));
    await act(async () => {
      tree = create(<CheckInModal />);
    });
    const claim = button(/^Nhận 5 Coin thưởng$/).props.onPress;
    await act(async () => {
      void claim();
      void claim();
    });
    expect(rewardService.checkIn).toHaveBeenCalledTimes(1);
    jest.mocked(rewardService.getDailyStatus).mockResolvedValue(ok({ ...status, checkedInToday: true, streakDay: 1 } as never));
    await act(async () => pending.resolve(refused(409, 'ALREADY_CHECKED_IN_TODAY', 'Hôm nay bạn đã điểm danh.')));
    expect(button(/^Hôm nay đã điểm danh$/)).toBeDefined();
  });
});
