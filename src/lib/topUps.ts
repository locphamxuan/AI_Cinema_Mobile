import type { CoinTopUp, TopUpStatus } from '../types/episodeAccess';

export type StatusTone = 'success' | 'pending' | 'failed';

/** How the history names each order state, and the colour it is shown in. */
export const TOP_UP_STATUS: Record<TopUpStatus, { label: string; tone: StatusTone }> = {
  PAID: { label: 'Thành công', tone: 'success' },
  PENDING: { label: 'Chờ thanh toán', tone: 'pending' },
  FAILED: { label: 'Thất bại', tone: 'failed' },
  CANCELLED: { label: 'Đã huỷ', tone: 'failed' },
  EXPIRED: { label: 'Hết hạn', tone: 'failed' },
};

/** 50000 -> "50.000 ₫". */
export function formatVnd(amount: number): string {
  return `${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₫`;
}

/** "14:05 27/10/2026" in the viewer's local time. */
export function orderTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** A pending order whose payment page is still open can be paid from the history. */
export function canResumePayment(topUp: Pick<CoinTopUp, 'status' | 'redirectUrl' | 'expiresAt'>, now = Date.now()): boolean {
  if (topUp.status !== 'PENDING' || !topUp.redirectUrl) return false;
  return !topUp.expiresAt || new Date(topUp.expiresAt).getTime() > now;
}
