import { authService } from '../services';
import { storage, STORAGE_KEYS } from '../lib/storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const session = (role: string) => ({
  ok: true,
  status: 200,
  text: async () =>
    JSON.stringify({
      accessToken: 'access',
      refreshToken: 'r'.repeat(30),
      user: { id: 'u1', email: 'lan@gmail.com', fullName: 'Lan', role },
    }),
}) as Response;

const refusal = (status: number, reason: string, message: string) => {
  const body = { error: { message, details: { reason } } };
  return { ok: false, status, json: async () => body, text: async () => JSON.stringify(body) } as Response;
};

describe('Google sign-in', () => {
  afterEach(async () => {
    jest.restoreAllMocks();
    await storage.remove(STORAGE_KEYS.AUTH_TOKEN);
  });

  it('sends only the token and keeps a member session', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce(session('MEMBER'));

    const res = await authService.googleLogin({ idToken: 'id-token' });

    expect(res.success).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/auth/google');
    expect(JSON.parse(String(init?.body))).toEqual({ idToken: 'id-token' });
    expect(await storage.getString(STORAGE_KEYS.AUTH_TOKEN, '')).toBe('access');
  });

  it('explains that Google sign-in is for members when the backend refuses a staff account', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(refusal(403, 'GOOGLE_STAFF_ACCOUNT', 'Google sign-in is for member accounts; sign in with your password'));

    const res = await authService.googleLogin({ idToken: 'id-token' });

    expect(res.success).toBe(false);
    expect(res.message).toBe('Đăng nhập Google chỉ dành cho thành viên. Tài khoản quản trị / nhân sự hãy đăng nhập bằng mật khẩu.');
  });

  it('turns staff accounts away like the password sign-in does', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(session('CONTENT_REVIEWER'))
      .mockResolvedValueOnce({ ok: true, status: 204, text: async () => '' } as Response);

    const res = await authService.googleLogin({ idToken: 'id-token' });

    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(String(fetchMock.mock.calls[1][0])).toContain('/auth/logout');
    expect(await storage.getString(STORAGE_KEYS.AUTH_TOKEN, '')).toBe('');
  });
});
