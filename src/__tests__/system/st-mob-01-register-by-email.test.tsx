import { accountRoutes, api, fail, renderApp, sessionReply, settle } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { fillRegister, openSheet } from './support/auth';
import { useSessionStore } from '../../store';

const adult = { name: 'Lan Anh', day: '14', month: '05', year: '2000', email: 'Lan.Anh@Example.com', password: 'Matkhau123' };

describe('ST-MOB-01 Register by email', () => {
  it('ST-MOB-01 creates the account with name, email, password and date of birth, then signs in', async () => {
    api.on('POST /auth/register', sessionReply());
    accountRoutes({ main: 0, bonus: 20 });
    await renderApp(<View />);
    await openSheet('register');
    await fillRegister(adult);
    await fireEvent.press(screen.getByRole('button', { name: 'Tiếp tục' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: /Điều khoản sử dụng/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    await settle();

    const [call] = api.called('POST /auth/register');
    expect(call.body).toEqual({ fullName: 'Lan Anh', email: 'lan.anh@example.com', password: 'Matkhau123', dateOfBirth: '2000-05-14' });
    expect(useSessionStore.getState().isAuthenticated).toBe(true);
    expect(await screen.findByText('Đã tạo tài khoản')).toBeOnTheScreen();
  });

  it('ST-MOB-01 refuses a date of birth under 18 before calling the API', async () => {
    await renderApp(<View />);
    await openSheet('register');
    await fillRegister({ ...adult, year: String(new Date().getFullYear() - 15) });
    await fireEvent.press(screen.getByRole('button', { name: 'Tiếp tục' }));
    expect(screen.getByText('Bạn cần đủ 18 tuổi trở lên để đăng ký tài khoản xem phim trên AI Cinema.')).toBeOnTheScreen();
    expect(api.called('POST /auth/register')).toHaveLength(0);
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
  });

  it('ST-MOB-01 shows the BE refusal when the email is already registered', async () => {
    api.on('POST /auth/register', fail(409, 'An account with this email already exists'));
    await renderApp(<View />);
    await openSheet('register');
    await fillRegister(adult);
    await fireEvent.press(screen.getByRole('button', { name: 'Tiếp tục' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: /Điều khoản sử dụng/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    await settle();
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
    expect(screen.getByText('Đã có tài khoản dùng email này.')).toBeOnTheScreen();
  });
});
