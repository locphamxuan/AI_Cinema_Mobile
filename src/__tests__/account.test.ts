import {
  changePasswordFailureMessage,
  maskDateInput,
  passwordChangeErrors,
  profileChanges,
  profileFailureMessage,
  profileFormErrors,
} from '../lib/accountForm';
import { authService } from '../services/authService';
import { apiClient } from '../services/apiClient';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { useSessionStore } from '../store';

function routeFetch(routes: Record<string, { status?: number; body?: unknown }>) {
  return jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
    const path = new URL(String(input), 'http://x').pathname.replace(/^\/api/, '');
    const route = routes[`${init?.method ?? 'GET'} ${path}`] ?? { status: 404, body: { message: 'not found' } };
    const status = route.status ?? 200;
    return {
      ok: status < 400,
      status,
      text: async () => (route.body === undefined ? '' : JSON.stringify(route.body)),
      json: async () => route.body,
    } as Response;
  });
}

const NOW = new Date('2026-11-16T12:00:00');
const profile = { name: 'Nguyễn Minh Anh', phone: '', dateOfBirth: '14/05/2003' };

afterEach(() => jest.restoreAllMocks());

describe('profile form (FE-12, BR-54)', () => {
  it('accepts a valid profile with an empty phone number', () => {
    expect(profileFormErrors(profile, NOW)).toEqual({});
  });

  it('explains each wrong field on its own', () => {
    const errors = profileFormErrors({ name: 'A', phone: '12ab', dateOfBirth: '31/02/2003' }, NOW);
    expect(errors.name).toContain('2 ký tự');
    expect(errors.phone).toContain('8 đến 15 chữ số');
    expect(errors.dateOfBirth).toContain('chưa hợp lệ');
  });

  it('keeps the 18+ rule of sign-up', () => {
    expect(profileFormErrors({ ...profile, dateOfBirth: '17/11/2008' }, NOW).dateOfBirth).toContain('18 tuổi');
    expect(profileFormErrors({ ...profile, dateOfBirth: '16/11/2008' }, NOW).dateOfBirth).toBeUndefined();
  });

  it('sends only the fields that changed, a cleared phone as null', () => {
    const saved = { name: 'Nguyễn Minh Anh', phoneNumber: '0912345678', dateOfBirth: '2003-05-14' };
    expect(profileChanges({ ...profile, phone: '0912345678' }, saved)).toEqual({});
    expect(profileChanges({ name: ' Minh Anh ', phone: '', dateOfBirth: '15/05/2003' }, saved)).toEqual({
      fullName: 'Minh Anh',
      phoneNumber: null,
      dateOfBirth: '2003-05-15',
    });
  });

  it('formats a typed birthday as DD/MM/YYYY', () => {
    expect(maskDateInput('1405')).toBe('14/05');
    expect(maskDateInput('14052003999')).toBe('14/05/2003');
    expect(maskDateInput('1')).toBe('1');
  });

  it('turns BE refusals into Vietnamese', () => {
    expect(profileFailureMessage({ statusCode: 403 })).toContain('18 tuổi');
    expect(profileFailureMessage({ statusCode: 400, message: 'Birthday cannot be in the future' })).toContain('tương lai');
  });
});

describe('change password', () => {
  it('needs the current password, the BE rule and a matching confirmation', () => {
    expect(passwordChangeErrors({ current: '', next: 'short', confirm: 'x' })).toEqual({
      current: expect.any(String),
      next: expect.stringContaining('8 đến 72'),
      confirm: expect.any(String),
    });
    expect(passwordChangeErrors({ current: 'abc12345', next: 'abc12345', confirm: 'abc12345' }).next).toContain('khác');
    expect(passwordChangeErrors({ current: 'old12345', next: 'new12345', confirm: 'new12345' })).toEqual({});
  });

  it('names a wrong current password and a Google account', () => {
    expect(changePasswordFailureMessage({ statusCode: 401 })).toBe('Mật khẩu hiện tại chưa đúng.');
    expect(changePasswordFailureMessage({ statusCode: 400, message: 'This account has no password; it uses Google sign-in' })).toContain('Google');
  });

  it('keeps the new session the BE returns so this device stays signed in', async () => {
    const fetchMock = routeFetch({
      'POST /auth/me/password': { body: { accessToken: 'fresh-access', refreshToken: 'fresh-refresh', user: { id: 'u1' } } },
    });
    const res = await authService.changePassword({ currentPassword: 'old12345', newPassword: 'new12345' });
    expect(res.success).toBe(true);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ currentPassword: 'old12345', newPassword: 'new12345' });
    expect(await storage.getString(STORAGE_KEYS.AUTH_TOKEN, '')).toBe('fresh-access');
    expect(await storage.getString(STORAGE_KEYS.REFRESH_TOKEN, '')).toBe('fresh-refresh');
    await apiClient.clearSession();
  });

  it('sends a wrong current password once, without a refresh-and-retry that would spend the rate limit twice', async () => {
    await apiClient.saveSession({ accessToken: 'access', refreshToken: 'refresh-1' });
    const fetchMock = routeFetch({
      'POST /auth/me/password': { status: 401, body: { message: 'The current password is incorrect' } },
      'POST /auth/refresh': { body: { accessToken: 'a2', refreshToken: 'r2' } },
    });
    const res = await authService.changePassword({ currentPassword: 'bad', newPassword: 'new12345' });
    expect(res.statusCode).toBe(401);
    const calls = fetchMock.mock.calls.map(([url]) => new URL(String(url), 'http://x').pathname.replace(/^\/api/, ''));
    expect(calls).toEqual(['/auth/me/password']);
    expect(await storage.getString(STORAGE_KEYS.REFRESH_TOKEN, '')).toBe('refresh-1');
    await apiClient.clearSession();
  });

  it('still refreshes an expired access token before changing the password', async () => {
    const b64 = (v: object) => Buffer.from(JSON.stringify(v)).toString('base64').replace(/=+$/, '');
    await apiClient.saveSession({ accessToken: `${b64({ alg: 'HS256' })}.${b64({ exp: 1 })}.s`, refreshToken: 'refresh-1' });
    const fetchMock = routeFetch({
      'POST /auth/refresh': { body: { accessToken: 'a2', refreshToken: 'r2' } },
      'POST /auth/me/password': { body: { accessToken: 'a3', refreshToken: 'r3', user: { id: 'u1' } } },
    });
    await authService.changePassword({ currentPassword: 'old12345', newPassword: 'new12345' });
    const calls = fetchMock.mock.calls.map(([url, init]) => `${new URL(String(url), 'http://x').pathname.replace(/^\/api/, '')} ${(init?.headers as Record<string, string>).Authorization ?? ''}`);
    expect(calls[0]).toMatch(/^\/auth\/refresh /);
    expect(calls[1]).toBe('/auth/me/password Bearer a2');
    await apiClient.clearSession();
  });

  it('reports a wrong current password from the store', async () => {
    routeFetch({ 'POST /auth/me/password': { status: 401, body: { message: 'The current password is incorrect' } } });
    const res = await useSessionStore.getState().changePassword('bad', 'new12345');
    expect(res).toEqual({ success: false, error: 'Mật khẩu hiện tại chưa đúng.' });
  });
});

describe('sessionStore.updateProfile', () => {
  it('PATCHes /auth/me and keeps the answer as the signed-in profile', async () => {
    useSessionStore.setState({
      isAuthenticated: true,
      user: { id: 'u1', name: 'Old', email: 'a@b.co', avatarUrl: '', role: 'vip', isVIP: true, createdAt: '' },
    });
    const fetchMock = routeFetch({
      'PATCH /auth/me': {
        body: { id: 'u1', email: 'a@b.co', fullName: 'Minh Anh', phoneNumber: '0912345678', dateOfBirth: '2003-05-14T00:00:00.000Z', role: 'MEMBER' },
      },
    });
    const res = await useSessionStore.getState().updateProfile({ fullName: 'Minh Anh', phoneNumber: '0912345678' });
    expect(res).toEqual({ success: true });
    expect(fetchMock.mock.calls[0][1]?.method).toBe('PATCH');
    const user = useSessionStore.getState().user!;
    expect(user).toMatchObject({ name: 'Minh Anh', phoneNumber: '0912345678', dateOfBirth: '2003-05-14', role: 'vip' });
    useSessionStore.setState({ isAuthenticated: false, user: null });
  });
});
