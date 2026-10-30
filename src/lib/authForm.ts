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
