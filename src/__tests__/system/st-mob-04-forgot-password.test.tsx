import { accountRoutes, api, fail, ok, renderApp, sessionReply, settle } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openSheet } from './support/auth';
import { useSessionStore } from '../../store';

describe('ST-MOB-04 Forgot password', () => {
  it('ST-MOB-04 refuses a wrong code, then the right code sets the new password and signs in on a new session', async () => {
    api.on('POST /auth/forgot-password', ok(null));
    api.on('POST /auth/reset-password', fail(401, 'Invalid or expired OTP'), sessionReply());
    accountRoutes();
    await renderApp(<View />);
    await openSheet('login');
    await fireEvent.press(screen.getByText('Quên mật khẩu?'));
    await fireEvent.changeText(screen.getByLabelText('Email nhận mã'), 'lan.anh@example.com');
    await fireEvent.press(screen.getByRole('button', { name: 'Gửi mã' }));
    await settle();
    expect(api.called('POST /auth/forgot-password')[0].body).toEqual({ email: 'lan.anh@example.com' });
    expect(screen.getByText(/mã 6 số đã được gửi tới hộp thư/)).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Mã xác nhận 6 số'), '111111');
    await fireEvent.changeText(screen.getByLabelText('Mật khẩu mới'), 'MatKhauMoi9');
    await fireEvent.changeText(screen.getByLabelText('Nhập lại mật khẩu mới'), 'MatKhauMoi9');
    await fireEvent.press(screen.getByRole('button', { name: 'Đặt mật khẩu mới' }));
    await settle();
    expect(screen.getByText('Mã không đúng hoặc đã hết hạn. Hãy kiểm tra lại hoặc gửi mã mới.')).toBeOnTheScreen();
    expect(useSessionStore.getState().isAuthenticated).toBe(false);

    await fireEvent.changeText(screen.getByLabelText('Mã xác nhận 6 số'), '246810');
    await fireEvent.press(screen.getByRole('button', { name: 'Đặt mật khẩu mới' }));
    await settle();
    expect(api.called('POST /auth/reset-password')[1].body).toEqual({
      email: 'lan.anh@example.com',
      otp: '246810',
      newPassword: 'MatKhauMoi9',
    });
    expect(useSessionStore.getState().isAuthenticated).toBe(true);
    // The BE ends every old session; this phone keeps only the new pair it answered with.
    expect(await AsyncStorage.getItem('ai_cinema_refresh_token')).toBe('refresh-new');
    expect(await screen.findByText('Đã đổi mật khẩu')).toBeOnTheScreen();
  });
});
