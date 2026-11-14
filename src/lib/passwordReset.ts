import type { ApiResponse } from '../types/api';

/** The backend sends at most one reset code a minute, so "send again" waits this long. */
export const RESEND_COOLDOWN_SECONDS = 60;

export const CODE_SENT_MESSAGE =
  'Nếu email này có tài khoản AI Cinema, mã 6 số đã được gửi tới hộp thư. Mã có hiệu lực 10 phút.';
export const WRONG_CODE_MESSAGE = 'Mã không đúng hoặc đã hết hạn. Hãy kiểm tra lại hoặc gửi mã mới.';
export const SAME_PASSWORD_MESSAGE = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
export const TOO_MANY_MESSAGE = 'Bạn đã thử quá nhiều lần. Đợi vài phút rồi thử lại.';
const NETWORK_MESSAGE = 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';

type Failure = Pick<ApiResponse, 'statusCode' | 'message'>;

/** A loose e-mail shape check; the backend has the final say. */
export const looksLikeEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** What to tell the viewer when POST /auth/forgot-password fails (it never reveals whether the account exists). */
export function forgotFailureMessage(res: Failure): string {
  if (res.statusCode === 429) return TOO_MANY_MESSAGE;
  if (res.statusCode === 400) return 'Email chưa đúng định dạng.';
  return res.message || NETWORK_MESSAGE;
}

/**
 * What to tell the viewer when POST /auth/reset-password fails. A 401 is a wrong, expired or
 * used-up code (it dies after 5 wrong tries), so the message points to sending a new one.
 */
export function resetFailureMessage(res: Failure): string {
  if (res.statusCode === 401) return WRONG_CODE_MESSAGE;
  if (res.statusCode === 429) return TOO_MANY_MESSAGE;
  if (res.statusCode === 400 && /different/i.test(res.message ?? '')) return SAME_PASSWORD_MESSAGE;
  return res.message || NETWORK_MESSAGE;
}
