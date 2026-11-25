import { api, ok, renderApp, settle, signIn } from './support/harness';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { dailyStatus, reduceMotion, spinResult, waitForSpin, wheel } from './support/rewards';
import { useAccountStore, useUiStore } from '../../store';

describe('ST-MOB-17 Check in and spin', () => {
  it('ST-MOB-17 pays the Bonus Coins once per day, grants the milestone spin and pays the prize', async () => {
    reduceMotion();
    await signIn();
    // The BE status before and after today's check-in.
    api.on('GET /daily-rewards/status', () =>
      api.called('POST /daily-rewards/check-in').length
        ? ok(dailyStatus({ checkedInToday: true, streakDay: 7, availableSpins: 1, bonusBalance: 110 }))
        : ok(dailyStatus()),
    );
    api.on(
      'POST /daily-rewards/check-in',
      ok({ checkInDate: '2026-11-24', streakDay: 7, streakContinued: true, bonusGranted: 50, spinGranted: true, mainBalance: 20, bonusBalance: 110 }, 201),
    );
    await renderApp(<View />);
    await act(() => useUiStore.getState().setCheckInModalOpen(true));
    await settle();

    await fireEvent.press(screen.getByRole('button', { name: 'Nhận 50 Coin thưởng' }));
    await settle();
    expect(screen.getByText('+50 Coin thưởng đã vào ví')).toBeOnTheScreen();
    expect(screen.getByText('Hôm nay là ngày cuối chuỗi nên bạn có thêm 1 lượt quay.')).toBeOnTheScreen();
    expect(useAccountStore.getState().wallet).toEqual({ mainCoin: 20, bonusCoin: 110 });

    // Checking in again the same Vietnam day: the button is closed and nothing is sent.
    const again = screen.getByRole('button', { name: 'Hôm nay đã điểm danh' });
    expect(again).toBeDisabled();
    await fireEvent.press(again);
    expect(api.called('POST /daily-rewards/check-in')).toHaveLength(1);
    expect(api.called('POST /daily-rewards/check-in')[0].headers['Idempotency-Key']).toMatch(/^checkin-/);

    api.on('GET /rewards/spins', ok(wheel(1)));
    api.on('POST /rewards/spins', ok(spinResult(0, { bonusBalance: 130 }), 201));
    await fireEvent.press(screen.getByRole('button', { name: 'Quay thưởng (còn 1 lượt)' }));
    await settle();
    await fireEvent.press(screen.getByRole('button', { name: 'Quay (còn 1 lượt)' }));
    await waitForSpin();
    await settle();
    expect(screen.getByText('+20 Coin thưởng đã vào ví.')).toBeOnTheScreen();
    expect(useAccountStore.getState().wallet.bonusCoin).toBe(130);
  });
});
