export const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72;

export interface AuthForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
}

/** The BE rule: 8 to 72 characters with at least one letter and one digit. */
function passwordOk(password: string): boolean {
  return password.length >= MIN_PASSWORD && password.length <= MAX_PASSWORD && /\p{L}/u.test(password) && /\d/.test(password);
}

/**
 * Normalizes a date of birth entered as either `YYYY-MM-DD`, `YYYY/MM/DD`, `DD/MM/YYYY`, or `DD-MM-YYYY`
 * into canonical `YYYY-MM-DD`, returning null when the calendar date is invalid.
 */
export function normalizeDateOfBirth(dateOfBirth: string): string | null {
  const trimmed = dateOfBirth.trim();
  if (!trimmed) return null;

  let year: number;
  let month: number;
  let day: number;

  const isoMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(trimmed);
  const dmyMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(trimmed);

  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else if (dmyMatch) {
    day = Number(dmyMatch[1]);
    month = Number(dmyMatch[2]);
    year = Number(dmyMatch[3]);
  } else {
    return null;
  }

  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    return null;
  }

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/** Formats a normalized or user-entered DOB string into `DD/MM/YYYY` for display. */
export function formatDobDisplay(dateOfBirth: string): string {
  const iso = normalizeDateOfBirth(dateOfBirth);
  if (!iso) return dateOfBirth.trim() || 'Chưa nhập';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Parses `YYYY-MM-DD` or `DD/MM/YYYY` strictly and returns completed age in years, or null when invalid. */
export function calculateAgeYears(dateOfBirth: string, now: Date = new Date()): number | null {
  const iso = normalizeDateOfBirth(dateOfBirth);
  if (!iso) return null;

  const [year, month, day] = iso.split('-').map(Number);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  let age = currentYear - year;
  if (currentMonth < month || (currentMonth === month && currentDay < day)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

/** BR-54: Member registration requires age 18 or older. */
export function isAtLeast18(dateOfBirth: string, now: Date = new Date()): boolean {
  const age = calculateAgeYears(dateOfBirth, now);
  return age !== null && age >= 18;
}

/** Why the sign-in / sign-up form cannot be sent yet, or null when it can. */
export function authFormError(isLogin: boolean, form: AuthForm): string | null {
  if (isLogin) return form.email.trim() && form.password ? null : 'Nhập email và mật khẩu.';
  if (!form.name.trim() || !form.email.trim() || !form.dateOfBirth.trim() || !form.password) {
    return 'Điền đủ họ tên, ngày sinh, email và mật khẩu.';
  }
  if (!normalizeDateOfBirth(form.dateOfBirth)) {
    return 'Ngày sinh chưa hợp lệ (nhập dạng DD/MM/YYYY, ví dụ 14/05/2003).';
  }
  if (!isAtLeast18(form.dateOfBirth)) {
    return 'Bạn cần đủ 18 tuổi trở lên để đăng ký tài khoản xem phim trên AI Cinema.';
  }
  if (!passwordOk(form.password)) return `Mật khẩu cần ${MIN_PASSWORD} đến ${MAX_PASSWORD} ký tự, có cả chữ và số.`;
  if (form.password !== form.confirmPassword) return 'Hai mật khẩu chưa giống nhau.';
  return null;
}
