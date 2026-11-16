import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useEpisodeGate } from '../hooks/useEpisodeGate';
import { UnlockEpisodeModal } from '../components/player/UnlockEpisodeModal';
import { Button } from '../components/common/Button';
import { episodeAccessService } from '../services/episodeAccessService';
import { useUiStore } from '../store';
import type { ApiResponse } from '../types/api';
import type { AccessDecision } from '../types/episodeAccess';
import type { Episode } from '../types/movie';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.setTimeout(90_000);
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ok = <T,>(data: T): ApiResponse<T> => ({ success: true, data, statusCode: 200 });
const episode = { id: 'ep-7', episodeNumber: 7, title: 'Tập 7', availability: 'AVAILABLE' } as Episode;
const decision = (enough: boolean): AccessDecision =>
  ({
    accessGranted: false,
    nextAction: enough ? 'UNLOCK_EPISODE' : 'OBTAIN_COIN',
    accessMethods: ['UNLOCK_EPISODE'],
    required: { coinPrice: 10, mainBalance: enough ? 8 : 2, bonusBalance: enough ? 5 : 1, enoughCoins: enough, missingCoins: enough ? 0 : 7 },
  }) as AccessDecision;

/** A screen with its own gate and the unlock sheet, like Watch Episode. */
const gate: { current?: ReturnType<typeof useEpisodeGate> } = {};
function Screen({ onGranted }: { onGranted: (e: Episode) => void }) {
  const g = useEpisodeGate(onGranted);
  React.useEffect(() => {
    gate.current = g;
  });
  return <UnlockEpisodeModal locked={g.locked} onClose={g.close} onUnlocked={onGranted} />;
}

const buttonLabelled = (root: ReactTestRenderer, label: RegExp) => root.root.findAllByType(Button).find((b) => label.test(b.props.label))!;

afterEach(() => {
  jest.restoreAllMocks();
  useUiStore.setState({ pendingPurchase: null, resumePurchase: null, isTopUpModalOpen: false });
});

describe('purchase intent across a top-up (BR-01)', () => {
  it('remembers the episode when the wallet is short and asks the BE again after a PAID top-up', async () => {
    const check = jest
      .spyOn(episodeAccessService, 'checkAccess')
      .mockResolvedValueOnce(ok(decision(false)))
      .mockResolvedValueOnce(ok({ ...decision(true), accessGranted: true } as AccessDecision));
    const granted = jest.fn();
    let root!: ReactTestRenderer;
    await act(async () => {
      root = create(<Screen onGranted={granted} />);
    });
    await act(async () => gate.current!.open(episode));
    await act(async () => buttonLabelled(root, /^Nạp Coin$/).props.onPress());
    expect(useUiStore.getState().isTopUpModalOpen).toBe(true);
    expect(useUiStore.getState().pendingPurchase).toMatchObject({ kind: 'episode', episode: { id: 'ep-7' }, label: 'Tập 7' });

    // TopUpModal's "Quay lại mở tập 7" after PAID.
    await act(async () => {
      useUiStore.setState({ resumePurchase: useUiStore.getState().pendingPurchase, pendingPurchase: null });
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(check).toHaveBeenCalledTimes(2);
    expect(granted).toHaveBeenCalledWith(episode);
    expect(useUiStore.getState().resumePurchase).toBeNull();
    act(() => root.unmount());
  });

  it('sends one purchase with one key when the button is tapped twice in a row', async () => {
    jest.spyOn(episodeAccessService, 'checkAccess').mockResolvedValue(ok(decision(true)));
    let release: () => void = () => undefined;
    const buy = jest.spyOn(episodeAccessService, 'purchaseEpisode').mockImplementation(
      () => new Promise((resolve) => (release = () => resolve({ success: false, data: null as never, message: 'x' }))),
    );
    let root!: ReactTestRenderer;
    await act(async () => {
      root = create(<Screen onGranted={() => undefined} />);
    });
    await act(async () => gate.current!.open(episode));
    const pay = buttonLabelled(root, /Mở khóa với 10 Coin/);
    act(() => {
      void pay.props.onPress();
      void pay.props.onPress();
    });
    expect(buy).toHaveBeenCalledTimes(1);
    await act(async () => release());
    act(() => {
      void buttonLabelled(root, /Mở khóa với 10 Coin/).props.onPress();
    });
    expect(buy).toHaveBeenCalledTimes(2);
    expect(buy.mock.calls[1][1]).toBe(buy.mock.calls[0][1]);
    await act(async () => release());
    act(() => root.unmount());
  });
});
