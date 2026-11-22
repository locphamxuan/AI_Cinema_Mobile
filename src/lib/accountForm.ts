import type { ApiResponse } from '../types/api';
import { PASSWORD_RULE_ERROR, formatDobDisplay, isAtLeast18, normalizeDateOfBirth, passwordOk } from './authForm';
import { SAME_PASSWORD_MESSAGE, TOO_MANY_MESSAGE } from './passwordReset';

/** Same shape as the BE rule: an optional +, then 8 to 15 digits with spaces or dots between them. */
const PHONE_RULE = /^\+?[0-9][0-9 .]{6,18}[0-9]$/;
const digitCount = (value: string) => value.replace(/\D/g, '').length;

export interface ProfileForm {
  name: string;
  phone: string;
  dateOfBirth: string;
}

export type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;

/** The form filled from the signed-in profile (birthday shown as DD/MM/YYYY). */
export function profileFormFrom(user: { name?: string; phoneNumber?: string | null; dateOfBirth?: string | null } | null): ProfileForm {
  return {
    name: user?.name ?? '',
    phone: user?.phoneNumber ?? '',
    dateOfBirth: user?.dateOfBirth ? formatDobDisplay(user.dateOfBirth) : '',
  };
}

/**
 * Field by field, why the profile cannot be saved yet; an empty object means it can. The BE keeps the birthday
 * optional on PATCH /auth/me, so an account that never had one (older sessions, Google) may leave it empty; one
 * already stored cannot be cleared.
 */
export function profileFormErrors(form: ProfileForm, now: Date = new Date(), savedDateOfBirth?: string | null): ProfileErrors {
  const errors: ProfileErrors = {};
  const name = form.name.trim();
  if (name.length < 2) errors.name = 'Họ tên cần ít nhất 2 ký tự.';
  else if (name.length > 255) errors.name = 'Họ tên dài tối đa 255 ký tự.';

  const phone = form.phone.trim();
  if (phone && (!PHONE_RULE.test(phone) || digitCount(phone) < 8 || digitCount(phone) > 15)) {
    errors.phone = 'Số điện thoại cần 8 đến 15 chữ số, ví dụ 0912345678.';
  }

  const dob = form.dateOfBirth.trim();
  if (!dob) {
    if (savedDateOfBirth) errors.dateOfBirth = 'Nhập ngày sinh theo dạng ngày/tháng/năm, ví dụ 14/05/2003.';
  }
  else if (!normalizeDateOfBirth(dob)) errors.dateOfBirth = 'Ngày sinh chưa hợp lệ, nhập theo dạng ngày/tháng/năm.';
  else if (!isAtLeast18(dob, now)) errors.dateOfBirth = 'Tài khoản xem phim cần đủ 18 tuổi trở lên.';
  return errors;
}

/** Only the fields that changed, in the BE's names; an emptied phone number is sent as null to clear it. */
export function profileChanges(
  form: ProfileForm,
  saved: { name: string; phoneNumber?: string | null; dateOfBirth?: string | null },
): { fullName?: string; phoneNumber?: string | null; dateOfBirth?: string } {
  const changes: { fullName?: string; phoneNumber?: string | null; dateOfBirth?: string } = {};
  const name = form.name.trim();
  if (name !== saved.name) changes.fullName = name;
  const phone = form.phone.trim();
  if (phone !== (saved.phoneNumber ?? '')) changes.phoneNumber = phone || null;
  const dob = normalizeDateOfBirth(form.dateOfBirth);
  if (dob && dob !== (saved.dateOfBirth ?? null)) changes.dateOfBirth = dob;
  return changes;
}

/** Types `14052003` as `14/05/2003` while the member keeps typing digits. */
export function maskDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export interface PasswordChangeForm {
  current: string;
  next: string;
  confirm: string;
}

export type PasswordChangeErrors = Partial<Record<keyof PasswordChangeForm, string>>;

export function passwordChangeErrors(form: PasswordChangeForm): PasswordChangeErrors {
  const errors: PasswordChangeErrors = {};
  if (!form.current) errors.current = 'Nhập mật khẩu đang dùng.';
  if (!passwordOk(form.next)) errors.next = PASSWORD_RULE_ERROR;
  else if (form.next === form.current) errors.next = SAME_PASSWORD_MESSAGE;
  if (form.confirm !== form.next) errors.confirm = 'Hai mật khẩu chưa giống nhau.';
  return errors;
}

type Failure = Pick<ApiResponse, 'statusCode' | 'message'>;
const FALLBACK = 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';

export function profileFailureMessage(res: Failure): string {
  if (res.statusCode === 403) return 'Tài khoản xem phim cần đủ 18 tuổi trở lên.';
  if (res.statusCode === 400 && /future/i.test(res.message ?? '')) return 'Ngày sinh không thể ở tương lai.';
  if (res.statusCode === 400 && /phone/i.test(res.message ?? '')) return 'Số điện thoại cần 8 đến 15 chữ số.';
  if (res.statusCode === 400) return 'Thông tin chưa hợp lệ, kiểm tra lại các ô rồi lưu lại.';
  return res.message || FALLBACK;
}

export function changePasswordFailureMessage(res: Failure): string {
  if (res.statusCode === 401) return 'Mật khẩu hiện tại chưa đúng.';
  if (res.statusCode === 429) return TOO_MANY_MESSAGE;
  if (res.statusCode === 400 && /google/i.test(res.message ?? '')) {
    return 'Tài khoản này đăng nhập bằng Google nên không có mật khẩu để đổi.';
  }
  if (res.statusCode === 400 && /different/i.test(res.message ?? '')) return SAME_PASSWORD_MESSAGE;
  if (res.statusCode === 400) return PASSWORD_RULE_ERROR;
  return res.message || FALLBACK;
}
