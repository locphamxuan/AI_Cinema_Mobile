import { authFormError, emailFormatError, passwordOk, type AuthForm } from '../lib/authForm';
import { topUpCreateFailure, topUpFailureText } from '../lib/topUps';
import { formatRoomCodeInput } from '../lib/roomEvents';
import { extractErrorMessage } from '../services/apiClient';

const signUp = (over: Partial<AuthForm> = {}): AuthForm => ({
  name: 'Nguyễn Minh Anh',
  email: 'anh@gmail.com',
  password: 'matkhau123',
  confirmPassword: 'matkhau123',
  dateOfBirth: '14/05/2003',
  ...over,
});

describe('sign-up and sign-in match RegisterRequestDto / LoginRequestDto', () => {
  it('wants a Latin letter like the BE PASSWORD_RULE ([A-Za-z]), not any Unicode letter', () => {
    expect(passwordOk('ạạạạạạ12')).toBe(false);
    expect(passwordOk('mậtkhẩu12')).toBe(true);
    expect(passwordOk('12345678')).toBe(false);
    expect(passwordOk('a'.repeat(72) + '1')).toBe(false);
  });

  it('refuses a one-letter name, a bad e-mail and an over-long e-mail before calling the BE', () => {
    expect(authFormError(false, signUp({ name: ' A ' }))).toBe('Họ tên cần ít nhất 2 ký tự.');
    expect(authFormError(false, signUp({ name: 'A'.repeat(256) }))).toBe('Họ tên dài tối đa 255 ký tự.');
    expect(authFormError(false, signUp({ email: 'anh@gmail' }))).toMatch(/Email chưa đúng định dạng/);
    expect(emailFormatError(`${'a'.repeat(250)}@g.com`)).toBe('Email dài tối đa 255 ký tự.');
    expect(authFormError(false, signUp())).toBeNull();
  });

  it('says a birthday in the future is in the future, not "under 18" (BR-54)', () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(authFormError(false, signUp({ dateOfBirth: `01/01/${nextYear}` }))).toBe('Ngày sinh không thể ở tương lai.');
    const fifteen = new Date().getFullYear() - 15;
    expect(authFormError(false, signUp({ dateOfBirth: `01/01/${fifteen}` }))).toMatch(/đủ 18 tuổi/);
  });

  it('checks the e-mail format on sign-in too, so the BE never answers a generic 400', () => {
    expect(authFormError(true, signUp({ email: 'anh' }))).toMatch(/Email chưa đúng định dạng/);
    expect(authFormError(true, signUp({ password: '' }))).toBe('Nhập email và mật khẩu.');
    expect(authFormError(true, signUp())).toBeNull();
  });
});

describe('top-up wording (VNPay only)', () => {
  it('never shows the BE English failureReason of a closed order', () => {
    expect(topUpFailureText({ status: 'EXPIRED', failureReason: 'The order expired before it was paid' })).toBe(
      'Đơn hết hạn trước khi được thanh toán.',
    );
    const mismatch = topUpFailureText({ status: 'FAILED', failureReason: 'The gateway reported 20000 VND instead of 50000 VND' });
    expect(mismatch).toContain('20.000 ₫');
    expect(mismatch).toContain('50.000 ₫');
    expect(mismatch).not.toMatch(/gateway|VND instead/);
    expect(topUpFailureText({ status: 'CANCELLED', failureReason: 'The gateway reported the payment as cancelled' })).toBe(
      'Bạn đã huỷ thanh toán trên VNPay.',
    );
    expect(topUpFailureText({ status: 'PAID', failureReason: null })).toBeNull();
  });

  it('does not word a VNPay outage as a Google sign-in problem', () => {
    const body = { error: { message: 'The VNPAY gateway is not configured', details: { reason: 'PROVIDER_NOT_CONFIGURED' } } };
    expect(extractErrorMessage(body)).not.toMatch(/Google/);
    expect(topUpCreateFailure({ reason: 'PROVIDER_NOT_CONFIGURED', message: 'x' })).toMatch(/chưa kết nối được VNPay/);
    expect(topUpCreateFailure({ reason: 'GATEWAY_UNREACHABLE', message: 'x' })).toMatch(/chưa bị trừ tiền/);
    expect(topUpCreateFailure({ reason: 'TOPUP_AMOUNT_OUT_OF_RANGE', message: 'x' })).toMatch(/ngoài mức cho phép/);
    expect(topUpCreateFailure({ message: 'Không kết nối được máy chủ.' })).toBe('Không kết nối được máy chủ.');
    // The Google refusal still reads as Google, through the shared API message table.
    const google = { error: { message: 'Google sign-in is not configured', details: { reason: 'PROVIDER_NOT_CONFIGURED' } } };
    expect(extractErrorMessage(google)).toBe('Đăng nhập bằng Google hiện chưa được bật.');
  });
});

describe('watch-room code input (BR-69)', () => {
  it('keeps only the BE alphabet (no 0/O/1/I) and shapes XXX-XXX', () => {
    expect(formatRoomCodeInput('ab2cd9')).toBe('AB2-CD9');
    expect(formatRoomCodeInput('AB2-CD9')).toBe('AB2-CD9');
    expect(formatRoomCodeInput('a0b1c O I2')).toBe('ABC-2');
    expect(formatRoomCodeInput('abcdefgh')).toBe('ABC-DEF');
  });
});
