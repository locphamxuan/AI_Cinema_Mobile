import { accountRoutes, api, fail, mockGoogle, renderApp, sessionReply, settle } from './support/harness';
import { fireEvent, screen, within } from '@testing-library/react-native';
import { TurboModuleRegistry, View } from 'react-native';
import { openSheet } from './support/auth';
import { useSessionStore } from '../../store';

// The Google picker is a native module of a development build; the SDK is replaced at its boundary.
beforeEach(() => {
  const real = TurboModuleRegistry.get.bind(TurboModuleRegistry);
  jest.spyOn(TurboModuleRegistry, 'get').mockImplementation(((name: string) => (name === 'RNGoogleSignin' ? {} : real(name))) as never);
});

describe('ST-MOB-02 Sign up and sign in with Google', () => {
  it('ST-MOB-02 signs a member already linked to Google in at once, with no terms step', async () => {
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

  it('ST-MOB-02 asks a new Google member to accept the terms before the account is opened', async () => {
    api.on('POST /auth/google', (call) =>
      (call.body as { acceptedTerms?: boolean }).acceptedTerms
        ? sessionReply('MEMBER', { fullName: 'Minh Google' })
        : fail(409, 'Accept the terms of use to open your account', 'GOOGLE_TERMS_REQUIRED'),
    );
    accountRoutes();
    await renderApp(<View />);
    await openSheet('login');
    await fireEvent.press(screen.getByRole('button', { name: 'Tiếp tục với Google' }));
    await settle();

    // Nothing is opened yet: the terms step blocks until the box is ticked.
    expect(screen.getByTestId('google-terms')).toBeOnTheScreen();
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
    expect(screen.getByRole('button', { name: 'Tạo tài khoản' })).toBeDisabled();
    await fireEvent.press(within(screen.getByTestId('google-terms')).getByRole('checkbox'));
    await fireEvent.press(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    await settle();

    expect(api.called('POST /auth/google').map((c) => c.body)).toEqual([
      { idToken: 'google-id-token' },
      { idToken: 'google-id-token', acceptedTerms: true },
    ]);
    expect(useSessionStore.getState()).toMatchObject({ isAuthenticated: true, user: { name: 'Minh Google' } });
    expect(mockGoogle.signIn).toHaveBeenCalledTimes(1);
  });

  it('ST-MOB-02 opens no account when the new Google member goes back from the terms', async () => {
    api.on('POST /auth/google', fail(409, 'Accept the terms of use to open your account', 'GOOGLE_TERMS_REQUIRED'));
    await renderApp(<View />);
    await openSheet('login');
    await fireEvent.press(screen.getByRole('button', { name: 'Tiếp tục với Google' }));
    await settle();
    await fireEvent.press(screen.getByRole('button', { name: 'Quay lại' }));
    await settle();

    expect(screen.queryByTestId('google-terms')).toBeNull();
    expect(api.called('POST /auth/google')).toHaveLength(1);
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
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
