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

/** Parses YYYY-MM-DD strictly and returns completed age in years, or null when invalid. */
export function calculateAgeYears(dateOfBirth: string, now: Date = new Date()): number | null {
  const trimmed = dateOfBirth.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    return null;
  }

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
  if (!passwordOk(form.password)) return `Mật khẩu cần ${MIN_PASSWORD} đến ${MAX_PASSWORD} ký tự, có cả chữ và số.`;
  if (form.password !== form.confirmPassword) return 'Hai mật khẩu chưa giống nhau.';
  return null;
}
