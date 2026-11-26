import { accountRoutes, api, doubleTap, mockBrowser, ok, renderApp, settle, signIn } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { enterAmount, openTopUp, topUpOrder, waitForPoll } from './support/wallet';
import { useAccountStore } from '../../store';

jest.setTimeout(30_000);

describe('ST-MOB-14 Top up with VNPay', () => {
  it('ST-MOB-14 opens one VNPay order, waits for the payment and shows the Main Coins credited', async () => {
    await signIn();
    api.slow('POST /wallet/top-ups', ok(topUpOrder(), 201));
    api.on('GET /wallet/top-ups/t-1', ok(topUpOrder({ status: 'PAID', paidAt: '2026-11-24T08:01:00.000Z' })));
    accountRoutes({ main: 50, bonus: 0 });
    await renderApp(<View />);
    await openTopUp();
    await settle();

    await enterAmount('50000');
    expect(screen.getByText(/Bạn nhận 50 Coin chính/)).toBeOnTheScreen();
    await doubleTap(screen.getByRole('button', { name: /^Thanh toán 50/ }));
    await settle();

    // One order per tap burst, paid in the VNPay page that returns to the app.
    expect(api.called('POST /wallet/top-ups')).toHaveLength(1);
    expect(api.called('POST /wallet/top-ups')[0].body).toEqual({ provider: 'VNPAY', amountVnd: 50000 });
    expect(mockBrowser.openAuthSessionAsync).toHaveBeenCalledTimes(1);
    expect(mockBrowser.openAuthSessionAsync).toHaveBeenCalledWith(topUpOrder().redirectUrl, 'aicinema://');
    expect(screen.getByRole('button', { name: 'Đang chờ VNPay xác nhận…' })).toBeDisabled();

    await waitForPoll();
    await settle();
    expect(api.called('GET /wallet/top-ups/t-1')).toHaveLength(1);
    expect(screen.getByText('Đã nạp xong')).toBeOnTheScreen();
    expect(screen.getByText('Ví hiện có 50 Coin chính và 0 Coin thưởng.')).toBeOnTheScreen();
    expect(useAccountStore.getState().wallet).toEqual({ mainCoin: 50, bonusCoin: 0 });
  });

  it('ST-MOB-14 stops waiting when the sheet is closed, so a late answer changes nothing', async () => {
    await signIn();
    api.on('POST /wallet/top-ups', ok(topUpOrder(), 201));
    api.on('GET /wallet/top-ups/t-1', ok(topUpOrder({ status: 'PAID' })));
    await renderApp(<View />);
    await openTopUp();
    await settle();
    await enterAmount('50000');
    await doubleTap(screen.getByRole('button', { name: /^Thanh toán 50/ }));
    await settle();
    // [0] is the backdrop (disabled while waiting); [1] is the header close button, which closes the sheet.
    await fireEvent.press(screen.getAllByLabelText('Đóng')[1]);

    await waitForPoll();
    expect(api.called('GET /wallet/top-ups/t-1')).toHaveLength(0);
    await openTopUp();
    await settle();
    expect(screen.queryByText('Đã nạp xong')).toBeNull();
  });
});
