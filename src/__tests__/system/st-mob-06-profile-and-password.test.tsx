import { answerDialog, api, beUser, fail, ok, renderApp, settle, shownDialog, signIn } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AccountScreen from '../../../app/account';
import { useSessionStore } from '../../store';

describe('ST-MOB-06 Edit the profile and change the password', () => {
  it('ST-MOB-06 saves a new name and phone, sending only what changed', async () => {
    await signIn();
    api.on('PATCH /auth/me', ok(beUser('MEMBER', { fullName: 'Lan Anh Nguyễn', phoneNumber: '0912345678' })));
    await renderApp(<AccountScreen />);
    await fireEvent.changeText(screen.getByLabelText('Họ tên'), 'Lan Anh Nguyễn');
    await fireEvent.changeText(screen.getByLabelText('Số điện thoại'), '0912345678');
    await fireEvent.press(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    await settle();

    expect(api.called('PATCH /auth/me')[0].body).toEqual({ fullName: 'Lan Anh Nguyễn', phoneNumber: '0912345678' });
    expect(shownDialog()?.title).toBe('Đã lưu thông tin');
    expect(useSessionStore.getState().user).toMatchObject({ name: 'Lan Anh Nguyễn', phoneNumber: '0912345678' });
  });

  it('ST-MOB-06 refuses a wrong current password, then changes it and keeps this phone signed in', async () => {
    await signIn();
    api.on(
      'POST /auth/me/password',
      fail(401, 'The current password is incorrect'),
      ok({ accessToken: 'new-access', refreshToken: 'refresh-after-change' }),
    );
    await renderApp(<AccountScreen />);
    const change = async (current: string) => {
      await fireEvent.changeText(screen.getByLabelText('Mật khẩu hiện tại'), current);
      await fireEvent.changeText(screen.getByLabelText('Mật khẩu mới'), 'MatKhauMoi9');
      await fireEvent.changeText(screen.getByLabelText('Nhập lại mật khẩu mới'), 'MatKhauMoi9');
      await fireEvent.press(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
      // Other devices are signed out: the member confirms first.
      expect(shownDialog()?.message).toBe('Các thiết bị khác đang đăng nhập tài khoản này sẽ bị đăng xuất.');
      await answerDialog('Đổi mật khẩu');
      await settle();
    };

    await change('SaiMatKhau1');
    expect(shownDialog()).toMatchObject({ title: 'Chưa đổi được mật khẩu', message: 'Mật khẩu hiện tại chưa đúng.' });
    await answerDialog('OK');

    await change('Matkhau123');
    expect(api.called('POST /auth/me/password')[1].body).toEqual({ currentPassword: 'Matkhau123', newPassword: 'MatKhauMoi9' });
    expect(shownDialog()?.title).toBe('Đã đổi mật khẩu');
    expect(useSessionStore.getState().isAuthenticated).toBe(true);
    expect(await AsyncStorage.getItem('ai_cinema_refresh_token')).toBe('refresh-after-change');
  });
});
