import { authService } from '../services';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { GOOGLE_NEEDS_BIRTHDAY, needsGoogleBirthday } from '../lib/googleSignIn';

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

  it('asks for one more answer only when a first Google sign-in needs a birthday', () => {
    expect(needsGoogleBirthday(GOOGLE_NEEDS_BIRTHDAY)).toBe(true);
    expect(needsGoogleBirthday('GOOGLE_LINK_NEEDS_PASSWORD')).toBe(false);
    expect(needsGoogleBirthday('GOOGLE_ACCOUNT_MISMATCH')).toBe(false);
    expect(needsGoogleBirthday(undefined)).toBe(false);
  });

  it('sends the token with the answer and keeps a member session', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce(session('MEMBER'));

    const res = await authService.googleLogin({ idToken: 'id-token', dateOfBirth: '2003-05-14' });

    expect(res.success).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/auth/google');
    expect(JSON.parse(String(init?.body))).toEqual({ idToken: 'id-token', dateOfBirth: '2003-05-14' });
    expect(await storage.getString(STORAGE_KEYS.AUTH_TOKEN, '')).toBe('access');
  });

  it('passes the missing step back so the sheet can ask for it', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(refusal(422, GOOGLE_NEEDS_BIRTHDAY, 'Enter your date of birth to finish signing up'));

    const res = await authService.googleLogin({ idToken: 'id-token' });

    expect(res.success).toBe(false);
    expect(res.reason).toBe(GOOGLE_NEEDS_BIRTHDAY);
    expect(res.message).toBe('Nhập ngày sinh để hoàn tất đăng ký (từ 18 tuổi).');
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
