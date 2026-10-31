import { authFormError } from '../lib/authForm';

const filled = { name: 'Lan', email: 'lan@mail.vn', password: 'phimhay12', confirmPassword: 'phimhay12' };
const PASSWORD_RULE = 'Mật khẩu cần 8 đến 72 ký tự, có cả chữ và số.';

describe('auth form', () => {
  it('needs only email and password to sign in', () => {
    expect(authFormError(true, { ...filled, name: '' })).toBeNull();
    expect(authFormError(true, { ...filled, email: '  ' })).toBe('Nhập email và mật khẩu.');
    expect(authFormError(true, { ...filled, password: '' })).toBe('Nhập email và mật khẩu.');
  });

  it('asks for name, email and password to sign up, without a birthday (BR-54)', () => {
    expect(authFormError(false, filled)).toBeNull();
    expect(authFormError(false, { ...filled, name: ' ' })).toBe('Điền đủ họ tên, email và mật khẩu.');
    expect(authFormError(false, { ...filled, email: '' })).toBe('Điền đủ họ tên, email và mật khẩu.');
  });

  it('applies the BE password rule before checking the repeat', () => {
    expect(authFormError(false, { ...filled, password: 'short1', confirmPassword: 'other' })).toBe(PASSWORD_RULE);
    expect(authFormError(false, { ...filled, password: '12345678', confirmPassword: '12345678' })).toBe(PASSWORD_RULE);
    expect(authFormError(false, { ...filled, password: 'chiconchu', confirmPassword: 'chiconchu' })).toBe(PASSWORD_RULE);
    expect(authFormError(false, { ...filled, password: 'mậtkhẩu9', confirmPassword: 'mậtkhẩu9' })).toBeNull();
    expect(authFormError(false, { ...filled, password: `a1${'x'.repeat(71)}`, confirmPassword: `a1${'x'.repeat(71)}` })).toBe(PASSWORD_RULE);
    expect(authFormError(false, { ...filled, confirmPassword: 'phimhay13' })).toBe('Hai mật khẩu chưa giống nhau.');
  });

  it('never ends a message with an exclamation mark', () => {
    const messages = [
      authFormError(true, { ...filled, email: '' }),
      authFormError(false, { ...filled, name: '' }),
      authFormError(false, { ...filled, password: 'a', confirmPassword: 'a' }),
      authFormError(false, { ...filled, confirmPassword: 'x' }),
    ];
    messages.forEach((m) => expect(m).not.toMatch(/!$/));
  });
});
