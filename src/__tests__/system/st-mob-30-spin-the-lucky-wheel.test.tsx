import { api, doubleTap, ok, renderApp, settle, signIn } from './support/harness';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { reduceMotion, spinResult, waitForSpin, watchLanding, wheel } from './support/rewards';
import { segmentAtPointer } from '../../components/wallet/luckyWheelMath';
import { useAccountStore, useUiStore } from '../../store';

async function openWheel() {
  await signIn();
  await renderApp(<View />);
  await act(() => useUiStore.getState().setRewardSpinOpen(true));
  await settle();
}

describe('ST-MOB-30 Spin the lucky wheel', () => {
  it('ST-MOB-30 shows the prizes without their chances and keeps the centre locked without a spin', async () => {
    api.on('GET /rewards/spins', ok(wheel(0)));
    await openWheel();

    expect(screen.getByText('+20 Coin thưởng')).toBeOnTheScreen();
    expect(screen.getByText('+50 Coin thưởng')).toBeOnTheScreen();
    expect(screen.getByText('Gói Tháng 30 ngày')).toBeOnTheScreen();
    expect(screen.queryByText(/%/)).toBeNull();
    const hub = screen.getByRole('button', { name: 'Chưa có lượt quay' });
    expect(hub).toBeDisabled();
    expect(screen.getByText(/^Bạn đang xem trước vòng quay/)).toBeOnTheScreen();
    await fireEvent.press(hub);
    expect(api.called('POST /rewards/spins')).toHaveLength(0);
  });

  it('ST-MOB-30 uses one spin for a double tap and lands on the prize the BE drew (D-47)', async () => {
    reduceMotion();
    const landing = watchLanding();
    api.on('GET /rewards/spins', ok(wheel(1)));
    api.slow('POST /rewards/spins', ok(spinResult(1), 201));
    await openWheel();

    await doubleTap(screen.getByRole('button', { name: 'Quay (còn 1 lượt)' }));
    await waitForSpin();
    await settle();

    const spins = api.called('POST /rewards/spins');
    expect(spins).toHaveLength(1);
    expect(spins[0].headers['Idempotency-Key']).toMatch(/^spin-/);
    // The wheel is sent to stop with the second prize (the one drawn) under the pointer.
    expect(segmentAtPointer(landing(), 3)).toBe(1);
    expect(screen.getByText('Bạn trúng 50 Coin thưởng')).toBeOnTheScreen();
    expect(screen.getByText('+50 Coin thưởng đã vào ví.')).toBeOnTheScreen();
    expect(useAccountStore.getState().wallet).toEqual({ mainCoin: 20, bonusCoin: 110 });
    expect(screen.getByRole('button', { name: 'Chưa có lượt quay' })).toBeDisabled();
  });
});
