import {
  authService,
  movieService,
  walletService,
  episodeAccessService,
} from '../services';
import { apiClient, extractErrorMessage, NETWORK_MESSAGE, statusMessage, TIMEOUT_MESSAGE } from '../services/apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { API_CONFIG } from '../constants/config';
import { storage, STORAGE_KEYS } from '../lib/storage';

describe('API Routes and Config', () => {
  it('should have proper API routes configured', () => {
    expect(API_ROUTES.AUTH.LOGIN).toBe('/auth/login');
    expect(API_ROUTES.MOVIES.LIST).toBe('/movies');
    expect(API_ROUTES.WALLET.INFO).toBe('/wallet');
    expect(API_ROUTES.REWARDS.CHECK_IN).toBe('/daily-rewards/check-in');
    expect(API_ROUTES.REWARDS.STATUS).toBe('/daily-rewards/status');
    expect(API_ROUTES.SUBSCRIPTION.MINE).toBe('/subscriptions/me');
    expect(API_ROUTES.ACCESS.DECISION('ep-1')).toBe('/episodes/ep-1/access');
  });

  it('should have smart base URL configured', () => {
    expect(API_CONFIG.BASE_URL).toBeDefined();
    expect(API_CONFIG.TIMEOUT_MS).toBeGreaterThan(0);
  });
});

describe('Mobile Services do not return mock fallbacks', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network offline'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('movieService.listMovies reports the backend network error', async () => {
    const res = await movieService.listMovies();
    expect(res.success).toBe(false);
    expect(res.message).toBe(NETWORK_MESSAGE);
  });

  it('walletService.getWalletInfo reports the backend network error', async () => {
    const res = await walletService.getWalletInfo();
    expect(res.success).toBe(false);
    expect(res.message).toBe(NETWORK_MESSAGE);
  });

  it('episodeAccessService.getPlans reports the backend network error', async () => {
    const res = await episodeAccessService.getPlans();
    expect(res.success).toBe(false);
    expect(res.message).toBe(NETWORK_MESSAGE);
  });
});

describe('authService against a mocked backend', () => {
  it('authService.login rejects staff roles and revokes their session', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            accessToken: 'access',
            refreshToken: 'r'.repeat(30),
            user: { id: 'u1', email: 'creator01@aicinema.com', fullName: 'Creator', role: 'CONTENT_CREATOR' },
          }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, status: 204, text: async () => '' } as Response);

    const res = await authService.login({ email: 'creator01@aicinema.com', password: 'Aicinema@123' });

    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.message).toContain('trang web quản lý');
    expect(String(fetchMock.mock.calls[1][0])).toContain('/auth/logout');
    expect(await storage.getString(STORAGE_KEYS.AUTH_TOKEN, '')).toBe('');
    jest.restoreAllMocks();
  });

  it('authService.login reports a wrong password without refreshing the session', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { code: 'UNAUTHORIZED', message: 'Incorrect email or password' } }),
    } as Response);

    const res = await authService.login({ email: ' Someone@Example.com ', password: 'wrongpassword1' });

    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.message).toBe('Email hoặc mật khẩu không đúng.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).email).toBe('someone@example.com');
    jest.restoreAllMocks();
  });

  it('authService.register opens the session of the new Member at once', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          accessToken: 'new-access',
          refreshToken: 'r'.repeat(30),
          user: { id: 'u1', email: 'new@example.com', fullName: 'New', role: 'MEMBER' },
        }),
    } as Response);
    const res = await authService.register({
      name: 'New',
      email: 'new@example.com',
      password: 'password123',
      dateOfBirth: '2000-01-31',
    });
    expect(res.success).toBe(true);
    const sent = JSON.parse(String((global.fetch as jest.Mock).mock.calls[0][1].body));
    expect(sent).toEqual({ email: 'new@example.com', password: 'password123', fullName: 'New', dateOfBirth: '2000-01-31' });
    expect(res.data.user?.role).toBe('MEMBER');
    expect(await storage.getString(STORAGE_KEYS.AUTH_TOKEN, '')).toBe('new-access');
    jest.restoreAllMocks();
  });

  it('authService.register reports duplicate email from backend', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: 'An account with this email already exists' }),
    } as Response);
    const res = await authService.register({
      name: 'Test Duplicate',
      email: 'test_node_check@example.com',
      password: 'password123',
      dateOfBirth: '2000-01-31',
    });
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(409);
    expect(res.message).toBe('Đã có tài khoản dùng email này.');
    jest.restoreAllMocks();
  });

  it('authService.register surfaces validation details from the backend error envelope', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { code: 'BAD_REQUEST', message: 'The request is invalid', details: ['email must be an email'] },
      }),
    } as Response);
    const res = await authService.register({
      name: 'Test Invalid',
      email: 'not-an-email',
      password: 'password123',
      dateOfBirth: '2000-01-31',
    });
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.message).toBe('Email không hợp lệ.');
    jest.restoreAllMocks();
  });
});

describe('apiClient success bodies', () => {
  afterEach(() => jest.restoreAllMocks());

  it('treats 204 No Content as success with null data', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 204,
      text: async () => '',
    } as Response);
    const res = await apiClient.post('/auth/logout', { refreshToken: 'x'.repeat(20) });
    expect(res.success).toBe(true);
    expect(res.data).toBeNull();
  });

  it('unwraps the paginated data array', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: [{ id: 'm1' }], meta: { totalItems: 1 } }),
    } as Response);
    const res = await apiClient.get('/movies');
    expect(res.data).toEqual([{ id: 'm1' }]);
  });

  it('keeps the page whole when the caller pages on (the notifications screen reads meta)', async () => {
    const page = { data: [{ id: 'n1' }], meta: { totalItems: 1, currentPage: 1, totalPages: 3 } };
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify(page) } as Response);
    const res = await apiClient.get('/notifications', { keepEnvelope: true });
    expect(res.data).toEqual(page);
  });
});

describe('session tokens', () => {
  const jsonResponse = (status: number, body: unknown) =>
    ({ ok: status < 400, status, text: async () => JSON.stringify(body), json: async () => body }) as Response;

  afterEach(async () => {
    jest.restoreAllMocks();
    await apiClient.clearSession();
  });

  it('refreshes an expired access token once and retries the request', async () => {
    await apiClient.saveSession({ accessToken: 'old-access', refreshToken: 'r'.repeat(30) });
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(jsonResponse(401, { error: { message: 'Token expired' } }))
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'new-access', refreshToken: 'n'.repeat(30) }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 'u1', email: 'a@b.c', fullName: 'A', role: 'MEMBER' }));

    const res = await authService.getProfile();

    expect(res.success).toBe(true);
    expect(res.data.name).toBe('A');
    expect(String(fetchMock.mock.calls[1][0])).toContain('/auth/refresh');
    const retryHeaders = fetchMock.mock.calls[2][1]?.headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe('Bearer new-access');
  });

  it('reports an expired session when the refresh token is rejected', async () => {
    await apiClient.saveSession({ accessToken: 'old-access', refreshToken: 'r'.repeat(30) });
    const expired = jest.fn();
    apiClient.onSessionExpired(expired);
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(401, { error: { message: 'Invalid refresh token' } }));

    const res = await authService.getProfile();

    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it('logout revokes the stored refresh token', async () => {
    await apiClient.saveSession({ accessToken: 'a', refreshToken: 'r'.repeat(30) });
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 204, text: async () => '' } as Response);

    await authService.logout();

    expect(String(fetchMock.mock.calls[0][0])).toContain('/auth/logout');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ refreshToken: 'r'.repeat(30) });
  });
});

describe('extractErrorMessage', () => {
  it('prefers details, then error.message, then message', () => {
    const details = ['email must be an email', 'password must be longer than or equal to 8 characters'];
    expect(extractErrorMessage({ error: { message: 'The request is invalid', details } })).toBe(
      'Email không hợp lệ. Thông tin quá ngắn: cần ít nhất 8 ký tự.',
    );
    expect(extractErrorMessage({ error: { message: 'An account with this email already exists' } })).toBe('Đã có tài khoản dùng email này.');
    expect(extractErrorMessage({ message: 'Tập này đã được mở khoá.' })).toBe('Tập này đã được mở khoá.');
    // English the app has no wording for is never shown: the caller falls back to what the status means.
    expect(extractErrorMessage({ error: { message: 'Some new refusal' } })).toBeUndefined();
    expect(extractErrorMessage(null)).toBeUndefined();
  });
});

describe('typed error and list bodies', () => {
  afterEach(() => jest.restoreAllMocks());

  it('maps a refusal reason to its message and hands the reason back', async () => {
    const body = { error: { code: 'FORBIDDEN', message: 'Forbidden', details: { reason: 'DEVICE_LIMIT_REACHED' } } };
    expect(extractErrorMessage(body)).toContain('đủ số thiết bị');
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 403, json: async () => body } as Response);

    const res = await apiClient.get('/playback/sessions');

    expect(res.reason).toBe('DEVICE_LIMIT_REACHED');
    expect(res.message).toContain('đủ số thiết bị');
  });

  it('ignores a reason that is not a string', () => {
    expect(extractErrorMessage({ error: { message: 'Room is closed', details: { reason: 42 } } })).toBe('Phòng đã đóng.');
  });

  it('reports a timeout when the request is aborted', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue({ name: 'AbortError', message: 'Aborted' });
    const res = await apiClient.get('/movies');
    expect(res.success).toBe(false);
    expect(res.message).toBe(TIMEOUT_MESSAGE);
  });

  it('reads a movie list wrapped in items, and answers no rows on failure', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => JSON.stringify({ items: [{ id: 'm1', title: 'A' }] }) } as Response)
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) } as Response);

    expect((await movieService.listMovies()).data.map((m) => m.id)).toEqual(['m1']);
    const failed = await movieService.listMovies();
    expect(failed.success).toBe(false);
    expect(failed.data).toEqual([]);
  });
});

describe('statusMessage', () => {
  it('says in Vietnamese what a refusal means when the API gave no readable reason', () => {
    expect(statusMessage(400)).toMatch(/chưa hợp lệ/);
    expect(statusMessage(401)).toMatch(/hết hạn đăng nhập/i);
    expect(statusMessage(403)).toMatch(/không có quyền/);
    expect(statusMessage(404)).toMatch(/Không tìm thấy/);
    expect(statusMessage(409)).toMatch(/tải lại/);
    expect(statusMessage(429)).toMatch(/quá nhanh/);
    expect(statusMessage(503)).toMatch(/đang bận/);
    expect(statusMessage(418)).toMatch(/Không thực hiện được/);
  });
});

describe('refreshAccessToken', () => {
  afterEach(() => jest.restoreAllMocks());

  it('gives the new token, or an empty one when the session cannot be renewed', async () => {
    await storage.set(STORAGE_KEYS.REFRESH_TOKEN, 'r'.repeat(30));
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ accessToken: 'fresh', refreshToken: 's'.repeat(30) }),
    } as Response);
    await expect(apiClient.refreshAccessToken()).resolves.toBe('fresh');

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as Response);
    await expect(apiClient.refreshAccessToken()).resolves.toBe('');
  });
});
