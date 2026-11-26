import React from 'react';
import { TouchableOpacity, TextInput } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import VipScreen from '../../app/vip';
import JoinWatchPartyScreen from '../../app/watch-party/join';
import { Button } from '../components/common/Button';
import { showDialog } from '../lib/dialog';
import { episodeAccessService } from '../services/episodeAccessService';
import { watchRoomService } from '../services/watchRoomService';
import { useAccountStore, useSessionStore, useUiStore } from '../store';
import type { ApiResponse } from '../types/api';
import type { MembershipPlan, MySubscription } from '../types/episodeAccess';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useFocusEffect: (effect: () => void) => jest.requireActual('react').useEffect(effect, [effect]),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }: { children?: React.ReactNode }) => children ?? null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../lib/dialog', () => ({ showDialog: jest.fn() }));
jest.setTimeout(60_000);
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ok = <T,>(data: T): ApiResponse<T> => ({ success: true, data, statusCode: 200 });
type DialogButton = { text: string; onPress?: () => void };
const lastDialog = () => {
  const calls = jest.mocked(showDialog).mock.calls;
  const [title, message, buttons] = calls[calls.length - 1] as [string, string, DialogButton[] | undefined];
  return { title, message, buttons: buttons ?? [] };
};

let tree: ReactTestRenderer;
afterEach(() => {
  act(() => tree?.unmount());
  jest.restoreAllMocks();
  jest.clearAllMocks();
  useSessionStore.setState({ isAuthenticated: false } as never);
  useAccountStore.setState({ subscription: null, wallet: { mainCoin: 0, bonusCoin: 0 } } as never);
  useUiStore.setState({ isTopUpModalOpen: false, pendingPurchase: null } as never);
});

const plan: MembershipPlan = {
  id: 'p1', code: 'monthly', name: 'Gói Tháng', description: null, period: 'MONTHLY',
  durationDays: 30, isFree: false, isActive: true, isFeatured: true, sortOrder: 1, priceCoins: 100,
};

const renderVip = async () => {
  jest.spyOn(episodeAccessService, 'getPlans').mockResolvedValue(ok([plan]));
  useAccountStore.setState({ loadAccountData: jest.fn(async () => undefined) } as never);
  useSessionStore.setState({ isAuthenticated: true } as never);
  await act(async () => {
    tree = create(<VipScreen />);
  });
};

describe('monthly plan (BR-30)', () => {
  it('offers a top-up instead of a doomed "Đăng ký" when the wallet is short', async () => {
    useAccountStore.setState({ wallet: { mainCoin: 30, bonusCoin: 10 } } as never);
    const join = jest.spyOn(episodeAccessService, 'joinPlan');
    await renderVip();
    act(() => tree.root.findAllByType(Button).find((b) => b.props.label === 'Đăng ký')!.props.onPress());
    const dialog = lastDialog();
    expect(dialog.title).toBe('Chưa đủ Coin cho Gói Tháng');
    expect(dialog.message).toContain('thiếu 60 Coin');
    expect(dialog.buttons.map((b) => b.text)).toEqual(['Để sau', 'Nạp Coin']);
    act(() => dialog.buttons[1].onPress!());
    expect(useUiStore.getState().isTopUpModalOpen).toBe(true);
    expect(useUiStore.getState().pendingPurchase).toMatchObject({ kind: 'plan', planId: 'p1' });
    expect(join).not.toHaveBeenCalled();
  });

  it('does not try to stop renewal once the cancel deadline has passed', async () => {
    const subscription = {
      id: 's1', status: 'ACTIVE', autoRenew: true, priceCoins: 100, plan: { name: 'Gói Tháng' },
      currentPeriodEnd: new Date(Date.now() + 3_600_000).toISOString(),
      cancelDeadline: new Date(Date.now() - 23 * 3_600_000).toISOString(),
    } as unknown as MySubscription;
    useAccountStore.setState({ subscription } as never);
    const stop = jest.spyOn(episodeAccessService, 'setAutoRenew');
    await renderVip();
    const toggle = tree.root.find((n) => n.props.accessibilityLabel === 'Tự gia hạn' && typeof n.props.onValueChange === 'function');
    act(() => toggle.props.onValueChange(false));
    expect(lastDialog().title).toBe('Chưa tắt được tự gia hạn');
    expect(lastDialog().message).toContain('ít nhất 24 giờ');
    expect(stop).not.toHaveBeenCalled();
  });
});

describe('join a watch room by code (BR-69)', () => {
  it('sends a Guest to sign in instead of calling the BE', async () => {
    const openAuthModal = jest.fn();
    useUiStore.setState({ openAuthModal } as never);
    const join = jest.spyOn(watchRoomService, 'joinByCode');
    await act(async () => {
      tree = create(<JoinWatchPartyScreen />);
    });
    act(() => tree.root.findByType(TextInput).props.onChangeText('ab2cd9'));
    expect(tree.root.findByType(TextInput).props.value).toBe('AB2-CD9');
    const enter = tree.root.findAllByType(TouchableOpacity).find((b) => b.props.disabled === false && !b.props.accessibilityLabel)!;
    await act(async () => enter.props.onPress());
    expect(openAuthModal).toHaveBeenCalledWith('login');
    expect(join).not.toHaveBeenCalled();
  });

  it('sends one join for a double tap (wrong codes count toward the lock)', async () => {
    useSessionStore.setState({ isAuthenticated: true } as never);
    let finish!: (v: ApiResponse<never>) => void;
    const join = jest.spyOn(watchRoomService, 'joinByCode').mockReturnValue(new Promise((r) => (finish = r)));
    await act(async () => {
      tree = create(<JoinWatchPartyScreen />);
    });
    act(() => tree.root.findByType(TextInput).props.onChangeText('AB2CD9'));
    const press = tree.root.findAllByType(TouchableOpacity).find((b) => b.props.disabled === false && !b.props.accessibilityLabel)!.props.onPress;
    await act(async () => {
      void press();
      void press();
    });
    expect(join).toHaveBeenCalledTimes(1);
    await act(async () => finish({ success: false, data: null, message: 'Mã phòng không đúng.' } as never));
  });
});
