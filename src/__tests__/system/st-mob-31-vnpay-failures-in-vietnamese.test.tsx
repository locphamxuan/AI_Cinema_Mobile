import { api, fail, ok, page, renderApp, settle, signIn } from './support/harness';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { TOP_UP_OPTIONS, enterAmount, topUpOrder } from './support/wallet';
import TopUpHistoryScreen from '../../../app/top-ups';
import { useUiStore } from '../../store';

describe('ST-MOB-31 VNPay failures in Vietnamese', () => {
  it('ST-MOB-31 says VNPay cannot be reached, never a Google sign-in message (D-46)', async () => {
    await signIn();
    api.on('GET /wallet/top-ups/options', ok(TOP_UP_OPTIONS));
    api.on('POST /wallet/top-ups', fail(503, 'Payment provider is not configured', 'PROVIDER_NOT_CONFIGURED'));
    await renderApp(<View />);
    await act(() => useUiStore.getState().setTopUpModalOpen(true));
    await settle();
    await enterAmount('50000');
    await fireEvent.press(screen.getByRole('button', { name: /^Thanh toán 50/ }));
    await settle();

    expect(screen.getByText('Tạm thời chưa kết nối được VNPay. Ví chưa bị trừ tiền, bạn thử lại sau ít phút.')).toBeOnTheScreen();
    expect(screen.queryByText(/Google/)).toBeNull();
  });

  it('ST-MOB-31 lets the member load the price list again after it failed', async () => {
    await signIn();
    api.on('GET /wallet/top-ups/options', fail(503, 'Service Unavailable'), ok(TOP_UP_OPTIONS));
    await renderApp(<View />);
    await act(() => useUiStore.getState().setTopUpModalOpen(true));
    await settle();
    expect(screen.getByPlaceholderText('Đang tải…')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Tải lại bảng giá' }));
    await settle();
    expect(api.called('GET /wallet/top-ups/options')).toHaveLength(2);
    expect(screen.getByPlaceholderText(/^Từ 10\.000đ đến 2\.000\.000đ$/)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Tải lại bảng giá' })).toBeNull();
  });

  it('ST-MOB-31 explains a failed and a cancelled top-up in the history in Vietnamese', async () => {
    await signIn();
    api.on(
      'GET /wallet/top-ups',
      page([
        topUpOrder({ topUpId: 't-failed', status: 'FAILED', failureReason: 'The gateway reported 20000 VND instead of 50000 VND' }),
        topUpOrder({ topUpId: 't-cancel', status: 'CANCELLED', failureReason: 'User cancelled at the gateway' }),
      ]),
    );
    await renderApp(<TopUpHistoryScreen />);
    await settle();

    expect(screen.getByText('Thất bại')).toBeOnTheScreen();
    expect(screen.getByText(/^Số tiền VNPay báo \(20\.000 ₫\) khác số tiền của đơn \(50\.000 ₫\)/)).toBeOnTheScreen();
    expect(screen.getByText('Đã huỷ')).toBeOnTheScreen();
    expect(screen.getByText('Bạn đã huỷ thanh toán trên VNPay.')).toBeOnTheScreen();
    expect(screen.queryByText(/gateway|cancelled/i)).toBeNull();
  });
});
