/** The VNPay top-up sheet as a member uses it. */
import { act, fireEvent, screen } from '@testing-library/react-native';
import { api, ok } from './harness';
import { useUiStore } from '../../../store';

export const TOP_UP_OPTIONS = { rateVnd: 1000, minVnd: 10_000, maxVnd: 2_000_000 };

export const topUpOrder = (overrides: Record<string, unknown> = {}) => ({
  topUpId: 't-1',
  provider: 'VNPAY',
  amountVnd: 50_000,
  coinsGranted: 50,
  rateVnd: 1000,
  status: 'PENDING',
  redirectUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=t-1',
  failureReason: null,
  paidAt: null,
  expiresAt: null,
  createdAt: '2026-11-24T08:00:00.000Z',
  ...overrides,
});

export async function openTopUp() {
  api.on('GET /wallet/top-ups/options', ok(TOP_UP_OPTIONS));
  await act(() => useUiStore.getState().setTopUpModalOpen(true));
}

export async function enterAmount(vnd: string) {
  await fireEvent.changeText(screen.getByPlaceholderText(/^Từ /), vnd);
}

/** The sheet asks VNPay every 2.5 s; the test lets that much real time pass. */
export const waitForPoll = () => act(() => new Promise((resolve) => setTimeout(resolve, 2700)));
