import { accountRoutes, api, doubleTap, renderApp, sessionReply, settle } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { fillLogin, fillRegister, openSheet } from './support/auth';

const good = { name: 'Lan Anh', day: '14', month: '05', year: '2000', email: 'lan.anh@example.com', password: 'Matkhau123' };

async function trySignUp(form: typeof good) {
  await renderApp(<View />);
  await openSheet('register');
  await fillRegister(form);
  await fireEvent.press(screen.getByRole('button', { name: 'Tiếp tục' }));
}

describe('ST-MOB-32 Sign-up and sign-in checks', () => {
  it.each([
    ['a one-letter name', { name: 'A' }, 'Họ tên cần ít nhất 2 ký tự.'],
    ['a bad e-mail', { email: 'lan.anh@example' }, 'Email chưa đúng định dạng, ví dụ ten@gmail.com.'],
    ['a password without a Latin letter', { password: 'ạạạạ1234' }, 'Mật khẩu cần 8 đến 72 ký tự, có cả chữ và số.'],
    ['a future birthday', { year: String(new Date().getFullYear() + 1) }, 'Ngày sinh không thể ở tương lai.'],
  ])('ST-MOB-32 refuses %s before calling the API', async (_case, change, message) => {
    await trySignUp({ ...good, ...change });
    expect(screen.getByText(message)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Tạo tài khoản' })).toBeNull();
    expect(api.called('POST /auth/register')).toHaveLength(0);
  });

  it('ST-MOB-32 sends one sign-up for a double tap on "Tạo tài khoản"', async () => {
    api.slow('POST /auth/register', sessionReply());
    accountRoutes();
    await trySignUp(good);
    await fireEvent.press(screen.getByRole('checkbox', { name: /Điều khoản sử dụng/ }));
    await doubleTap(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    expect(api.called('POST /auth/register')).toHaveLength(1);
    await settle();
  });

  it('ST-MOB-32 checks the e-mail on sign-in and sends one sign-in for a double tap on "Đăng nhập"', async () => {
    await renderApp(<View />);
    await openSheet('login');
    await fillLogin('lan.anh', 'Matkhau123');
    await fireEvent.press(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(screen.getByText('Email chưa đúng định dạng, ví dụ ten@gmail.com.')).toBeOnTheScreen();
    expect(api.called('POST /auth/login')).toHaveLength(0);

    api.slow('POST /auth/login', sessionReply());
    accountRoutes();
    await fillLogin('lan.anh@example.com', 'Matkhau123');
    await doubleTap(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(api.called('POST /auth/login')).toHaveLength(1);
    await settle();
  });
});
