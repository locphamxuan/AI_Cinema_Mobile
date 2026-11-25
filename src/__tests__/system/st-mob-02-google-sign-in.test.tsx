import { accountRoutes, api, fail, mockGoogle, renderApp, sessionReply, settle } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import { TurboModuleRegistry, View } from 'react-native';
import { openSheet } from './support/auth';
import { useSessionStore } from '../../store';

// The Google picker is a native module of a development build; the SDK is replaced at its boundary.
beforeEach(() => {
  const real = TurboModuleRegistry.get.bind(TurboModuleRegistry);
  jest.spyOn(TurboModuleRegistry, 'get').mockImplementation(((name: string) => (name === 'RNGoogleSignin' ? {} : real(name))) as never);
});

describe('ST-MOB-02 Sign up and sign in with Google', () => {
  it('ST-MOB-02 opens a Member account with the picked Google account in one tap', async () => {
    api.on('POST /auth/google', sessionReply('MEMBER', { fullName: 'Minh Google' }));
    accountRoutes();
    await renderApp(<View />);
    await openSheet('login');
    await fireEvent.press(screen.getByRole('button', { name: 'Tiếp tục với Google' }));
    await settle();

    expect(mockGoogle.signIn).toHaveBeenCalledTimes(1);
    expect(api.called('POST /auth/google')[0].body).toEqual({ idToken: 'google-id-token' });
    expect(useSessionStore.getState()).toMatchObject({ isAuthenticated: true, user: { name: 'Minh Google' } });
  });

  it('ST-MOB-02 tells an email that already has a password account to use the password', async () => {
    api.on(
      'POST /auth/google',
      fail(409, 'This email already has an account; sign in with your password', 'GOOGLE_EMAIL_REGISTERED'),
    );
    await renderApp(<View />);
    await openSheet('login');
    await fireEvent.press(screen.getByRole('button', { name: 'Tiếp tục với Google' }));
    await settle();

    expect(screen.getByText('Email này đã có tài khoản. Hãy đăng nhập bằng mật khẩu.')).toBeOnTheScreen();
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
  });

  it('ST-MOB-02 does nothing when the viewer closes the Google picker', async () => {
    mockGoogle.signIn.mockResolvedValueOnce({ type: 'cancelled' } as never);
    await renderApp(<View />);
    await openSheet('login');
    await fireEvent.press(screen.getByRole('button', { name: 'Tiếp tục với Google' }));
    await settle();
    expect(api.called('POST /auth/google')).toHaveLength(0);
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
  });
});
