import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput, TouchableOpacity } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AuthModal } from '../components/auth/AuthModal';
import { Button } from '../components/common/Button';
import { resetFormError } from '../lib/authForm';
import { CODE_SENT_MESSAGE, SAME_PASSWORD_MESSAGE, WRONG_CODE_MESSAGE, resetFailureMessage } from '../lib/passwordReset';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { authService } from '../services';
import { useSessionStore, useUiStore } from '../store';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../components/auth/GoogleSignInSection', () => ({ GoogleSignInSection: () => null }));
jest.mock('../lib/dialog', () => ({ showDialog: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Route = { status?: number; body?: unknown };

/** Answers each fetch by `METHOD path` (without the /api prefix); anything else is a 404. */
function routeFetch(routes: Record<string, Route | Route[]>) {
  return jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
    const path = new URL(String(input), 'http://x').pathname.replace(/^\/api/, '');
    const entry = routes[`${init?.method ?? 'GET'} ${path}`];
    const route = (Array.isArray(entry) ? entry.shift() : entry) ?? { status: 404, body: { message: 'not found' } };
    const status = route.status ?? 200;
    return {
      ok: status < 400,
      status,
      text: async () => (route.body === undefined ? '' : JSON.stringify(route.body)),
      json: async () => route.body,
    } as Response;
  });
}

const sentBody = (fetchMock: jest.SpyInstance, path: string) => {
  const call = fetchMock.mock.calls.find(([url]) => String(url).includes(path));
  return call ? JSON.parse(String(call[1]?.body)) : undefined;
};

const memberSession = {
  accessToken: 'reset-access',
  refreshToken: 'r'.repeat(30),
  accessTokenExpiresIn: 900,
  user: { id: 'u1', email: 'viewer@example.com', fullName: 'Viewer', role: 'MEMBER' },
};

const settle = () =>
  act(async () => {
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
  });

const input = (root: ReactTestRenderer, label: string) =>
  root.root.findAllByType(TextInput).find((i) => i.props.accessibilityLabel === label)!;
const button = (root: ReactTestRenderer, label: RegExp) =>
  root.root.findAllByType(Button).find((b) => label.test(b.props.label))!;
const tappable = (root: ReactTestRenderer, text: string) =>
  root.root
    .findAllByType(TouchableOpacity)
    .find((t) => t.findAll((n) => n.props.children === text).length > 0)!;
const shows = (root: ReactTestRenderer, text: string) => JSON.stringify(root.toJSON()).includes(text);

async function type(root: ReactTestRenderer, label: string, value: string) {
  act(() => input(root, label).props.onChangeText(value));
}

async function press(root: ReactTestRenderer, label: RegExp) {
  await act(async () => {
    await button(root, label).props.onPress();
  });
  await settle();
}

/** Opens the sign-in sheet with an email typed in, then taps "Quên mật khẩu?". */
async function openForgot(email = 'Viewer@Example.com') {
  let root!: ReactTestRenderer;
  act(() => {
    useUiStore.setState({ isAuthModalOpen: true, authModalMode: 'login', initialAuthEmail: email });
    root = create(<AuthModal />);
  });
  await settle();
  act(() => tappable(root, 'Quên mật khẩu?').props.onPress());
  return root;
}

async function fillReset(root: ReactTestRenderer, otp: string, password: string, confirm = password) {
  await type(root, 'Mã xác nhận 6 số', otp);
  await type(root, 'Mật khẩu mới', password);
  await type(root, 'Nhập lại mật khẩu mới', confirm);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  act(() => {
    useSessionStore.setState({ isAuthenticated: false, user: null });
    useUiStore.setState({ isAuthModalOpen: false, authModalMode: 'login', initialAuthEmail: '' });
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('authService password reset calls', () => {
  it('POST /auth/forgot-password sends only the normalized email', async () => {
    const fetchMock = routeFetch({ 'POST /auth/forgot-password': { status: 200 } });
    const res = await authService.forgotPassword(' Viewer@Example.com ');
    expect(res.success).toBe(true);
    expect(sentBody(fetchMock, '/auth/forgot-password')).toEqual({ email: 'viewer@example.com' });
  });

  it('POST /auth/reset-password keeps the returned session like a sign-in', async () => {
    const fetchMock = routeFetch({ 'POST /auth/reset-password': { body: memberSession } });
    const res = await authService.resetPassword({ email: 'Viewer@Example.com', otp: '123456', newPassword: 'newpass123' });
    expect(res.success).toBe(true);
    expect(sentBody(fetchMock, '/auth/reset-password')).toEqual({
      email: 'viewer@example.com',
      otp: '123456',
      newPassword: 'newpass123',
    });
    expect(await storage.getString(STORAGE_KEYS.AUTH_TOKEN, '')).toBe('reset-access');
  });

  it('keeps the real status of a refusal and none for a network failure', async () => {
    routeFetch({ 'POST /auth/reset-password': { status: 401, body: { message: 'Invalid code' } } });
    expect((await authService.resetPassword({ email: 'a@b.co', otp: '000000', newPassword: 'x' })).statusCode).toBe(401);
    jest.restoreAllMocks();
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network offline'));
    const offline = await authService.resetPassword({ email: 'a@b.co', otp: '000000', newPassword: 'x' });
    expect(offline.statusCode).toBeUndefined();
    expect(resetFailureMessage(offline)).toBe('network offline');
  });
});

describe('password reset messages and validation', () => {
  it('maps backend refusals to Vietnamese messages', () => {
    expect(resetFailureMessage({ statusCode: 401, message: 'Invalid code' })).toBe(WRONG_CODE_MESSAGE);
    expect(resetFailureMessage({ statusCode: 400, message: 'Choose a password different from the current one' })).toBe(
      SAME_PASSWORD_MESSAGE,
    );
    expect(resetFailureMessage({ statusCode: 429 })).toMatch(/quá nhiều lần/);
  });

  it('blocks a short code, a weak password and mismatched passwords', () => {
    expect(resetFormError({ otp: '12345', password: 'newpass123', confirmPassword: 'newpass123' })).toMatch(/mã 6 số/);
    expect(resetFormError({ otp: '123456', password: 'short', confirmPassword: 'short' })).toMatch(/8 đến 72/);
    expect(resetFormError({ otp: '123456', password: 'newpass123', confirmPassword: 'newpass124' })).toMatch(/chưa giống/);
    expect(resetFormError({ otp: '123456', password: 'newpass123', confirmPassword: 'newpass123' })).toBeNull();
  });
});

describe('forgot-password flow in the auth sheet', () => {
  it('sends the code, then signs in with the new password and closes the sheet', async () => {
    const fetchMock = routeFetch({
      'POST /auth/forgot-password': { status: 200 },
      'POST /auth/reset-password': { body: memberSession },
    });
    const root = await openForgot();
    expect(input(root, 'Email nhận mã').props.value).toBe('Viewer@Example.com');

    await press(root, /^Gửi mã/);
    expect(sentBody(fetchMock, '/auth/forgot-password')).toEqual({ email: 'viewer@example.com' });
    expect(shows(root, CODE_SENT_MESSAGE)).toBe(true);

    await fillReset(root, '123456', 'newpass123');
    await press(root, /Đặt mật khẩu mới/);

    expect(sentBody(fetchMock, '/auth/reset-password')).toEqual({
      email: 'viewer@example.com',
      otp: '123456',
      newPassword: 'newpass123',
    });
    expect(useSessionStore.getState().isAuthenticated).toBe(true);
    expect(useUiStore.getState().isAuthModalOpen).toBe(false);
    expect(await storage.getString(STORAGE_KEYS.AUTH_TOKEN, '')).toBe('reset-access');
    act(() => root.unmount());
  });

  it('tells the viewer to check or resend the code after a 401', async () => {
    routeFetch({
      'POST /auth/forgot-password': { status: 200 },
      'POST /auth/reset-password': { status: 401, body: { message: 'Invalid or expired code' } },
    });
    const root = await openForgot();
    await press(root, /^Gửi mã/);
    await fillReset(root, '654321', 'newpass123');
    await press(root, /Đặt mật khẩu mới/);

    expect(shows(root, WRONG_CODE_MESSAGE)).toBe(true);
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
    act(() => root.unmount());
  });

  it('does not call the backend while the code or passwords are wrong', async () => {
    const fetchMock = routeFetch({ 'POST /auth/forgot-password': { status: 200 } });
    const root = await openForgot();
    await press(root, /^Gửi mã/);

    await fillReset(root, '12a4', 'newpass123');
    expect(input(root, 'Mã xác nhận 6 số').props.value).toBe('124');
    expect(input(root, 'Mã xác nhận 6 số').props.maxLength).toBe(6);
    await press(root, /Đặt mật khẩu mới/);
    expect(shows(root, 'Nhập đủ mã 6 số trong email.')).toBe(true);

    await fillReset(root, '123456', 'newpass123', 'newpass999');
    await press(root, /Đặt mật khẩu mới/);
    expect(shows(root, 'Hai mật khẩu chưa giống nhau.')).toBe(true);

    expect(sentBody(fetchMock, '/auth/reset-password')).toBeUndefined();
    act(() => root.unmount());
  });

  it('keeps "Gửi lại mã" disabled for 60 seconds, then sends again', async () => {
    const fetchMock = routeFetch({ 'POST /auth/forgot-password': { status: 200 } });
    const root = await openForgot();
    jest.useFakeTimers();
    await press(root, /^Gửi mã/);

    expect(button(root, /Gửi lại mã/).props.disabled).toBe(true);
    expect(button(root, /Gửi lại mã/).props.label).toBe('Gửi lại mã sau 60 giây');

    act(() => jest.advanceTimersByTime(59_000));
    expect(button(root, /Gửi lại mã/).props.disabled).toBe(true);
    expect(button(root, /Gửi lại mã/).props.label).toBe('Gửi lại mã sau 1 giây');

    act(() => jest.advanceTimersByTime(1_000));
    expect(button(root, /Gửi lại mã/).props.disabled).toBe(false);

    await press(root, /Gửi lại mã/);
    const sends = fetchMock.mock.calls.filter(([url]) => String(url).includes('/auth/forgot-password'));
    expect(sends).toHaveLength(2);
    act(() => root.unmount());
  });

  it('returns to the sign-in form from either step', async () => {
    routeFetch({ 'POST /auth/forgot-password': { status: 200 } });
    const root = await openForgot();
    await press(root, /^Gửi mã/);
    act(() => tappable(root, 'Quay lại đăng nhập').props.onPress());
    expect(button(root, /^Đăng nhập$/)).toBeDefined();
    act(() => root.unmount());
  });
});
