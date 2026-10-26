import { canResumePayment, formatVnd, TOP_UP_STATUS } from '../lib/topUps';
import { walletService } from '../services/walletService';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('top-up history', () => {
  afterEach(() => jest.restoreAllMocks());

  it('formats VND with dot thousands', () => {
    expect(formatVnd(50000)).toBe('50.000 ₫');
    expect(formatVnd(1250000)).toBe('1.250.000 ₫');
    expect(formatVnd(900)).toBe('900 ₫');
  });

  it('names every order state', () => {
    expect(TOP_UP_STATUS.PAID).toEqual({ label: 'Thành công', tone: 'success' });
    expect(TOP_UP_STATUS.PENDING.tone).toBe('pending');
    expect(TOP_UP_STATUS.EXPIRED.tone).toBe('failed');
  });

  it('offers to resume only a pending order whose payment page is still open', () => {
    const now = Date.parse('2026-10-27T03:00:00Z');
    const pending = { status: 'PENDING' as const, redirectUrl: 'https://pay', expiresAt: '2026-10-27T03:10:00Z' };
    expect(canResumePayment(pending, now)).toBe(true);
    expect(canResumePayment({ ...pending, expiresAt: '2026-10-27T02:59:00Z' }, now)).toBe(false);
    expect(canResumePayment({ ...pending, redirectUrl: null }, now)).toBe(false);
    expect(canResumePayment({ ...pending, status: 'PAID' }, now)).toBe(false);
  });

  it('keeps the page meta so the history knows when to stop paging', async () => {
    const page = { data: [{ topUpId: 't-1' }], meta: { currentPage: 1, totalPages: 3, itemsPerPage: 20 } };
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify(page) } as Response);

    const res = await walletService.getTopUps(2);

    expect(String(fetchMock.mock.calls[0][0])).toContain('/wallet/top-ups?page=2');
    expect(res.data).toEqual(page);
  });
});
