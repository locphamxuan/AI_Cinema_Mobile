import type { ApiResponse } from '../types/api';
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

/** What the history and the top-up sheet say for a closed order: the BE writes `failureReason` in English. */
const FAILED_TEXT: Partial<Record<TopUpStatus, string>> = {
  FAILED: 'VNPay báo thanh toán không thành công, ví không bị cộng hay trừ Coin.',
  CANCELLED: 'Bạn đã huỷ thanh toán trên VNPay.',
  EXPIRED: 'Đơn hết hạn trước khi được thanh toán.',
};

export function topUpFailureText(topUp: Pick<CoinTopUp, 'status' | 'failureReason'>): string | null {
  // "The gateway reported 20000 VND instead of 50000 VND": paid a different amount than the order.
  const mismatch = /reported (\d+) VND instead of (\d+) VND/.exec(topUp.failureReason ?? '');
  if (topUp.status === 'FAILED' && mismatch) {
    return `Số tiền VNPay báo (${formatVnd(Number(mismatch[1]))}) khác số tiền của đơn (${formatVnd(Number(mismatch[2]))}). Đơn không được cộng Coin, hãy liên hệ hỗ trợ nếu tài khoản ngân hàng đã bị trừ tiền.`;
  }
  return FAILED_TEXT[topUp.status] ?? null;
}

/** Why POST /wallet/top-ups was refused, in words the member can act on. */
export function topUpCreateFailure(res: Pick<ApiResponse, 'reason' | 'message'>): string {
  if (res.reason === 'PROVIDER_NOT_CONFIGURED' || res.reason === 'GATEWAY_UNREACHABLE') {
    return 'Tạm thời chưa kết nối được VNPay. Ví chưa bị trừ tiền, bạn thử lại sau ít phút.';
  }
  if (res.reason === 'TOPUP_AMOUNT_OUT_OF_RANGE') return 'Số tiền nạp nằm ngoài mức cho phép. Mở lại mục Nạp Coin để xem mức mới.';
  return res.message || 'Chưa tạo được đơn nạp. Kiểm tra kết nối rồi thử lại.';
}
