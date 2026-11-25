import { api, fail, renderApp, sessionReply, settle } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fillLogin, openSheet } from './support/auth';
import { useSessionStore, useUiStore } from '../../store';

describe('ST-MOB-03 Refuse wrong credentials and STUDIO accounts', () => {
  it('ST-MOB-03 shows a message for a wrong password and stays signed out', async () => {
    api.on('POST /auth/login', fail(401, 'Incorrect email or password'));
    await renderApp(<View />);
    await openSheet('login');
    await fillLogin('lan.anh@example.com', 'SaiMatKhau1');
    await fireEvent.press(screen.getByRole('button', { name: 'Đăng nhập' }));
    await settle();

    expect(screen.getByText('Email hoặc mật khẩu không đúng.')).toBeOnTheScreen();
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
    // A wrong password is not an expired session: no refresh is tried.
    expect(api.called('POST /auth/refresh')).toHaveLength(0);
  });

  it('ST-MOB-03 sends a STUDIO account to Studio Web and keeps no session on the phone', async () => {
    api.on('POST /auth/login', sessionReply('STUDIO'));
    api.on('POST /auth/logout', { status: 204 });
    await renderApp(<View />);
    await openSheet('login');
    await fillLogin('studio@partner.vn', 'Studio12345');
    await fireEvent.press(screen.getByRole('button', { name: 'Đăng nhập' }));
    await settle();

    expect(screen.getByText(/Tài khoản Studio đối tác dùng trang web dành cho Studio/)).toBeOnTheScreen();
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
    expect(useUiStore.getState().isAuthModalOpen).toBe(true);
    expect(await AsyncStorage.getItem('ai_cinema_auth_token')).toBeNull();
  });
});
