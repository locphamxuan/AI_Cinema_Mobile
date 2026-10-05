// Mock AsyncStorage for headless test execution
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  adaptApiMovieToMovie,
  adaptApiEpisodeToEpisode,
  formatDuration,
  adaptApiWalletToWallet,
  adaptApiCheckInToStreak,
  adaptApiProjectToProject,
  adaptUserProfile,
} from '../lib/apiAdapter';
import { getTodayDayIndex, getTodayDateString, VN_DAY_LABELS } from '../utils/date';
import {
  authService,
  movieService,
  walletService,
  subscriptionService,
  productionService,
  chatService,
} from '../services';
import { apiClient, extractErrorMessage } from '../services/apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { API_CONFIG } from '../constants/config';
import { storage, STORAGE_KEYS } from '../lib/storage';

describe('API Routes and Config', () => {
  it('should have proper API routes configured', () => {
    expect(API_ROUTES.AUTH.LOGIN).toBe('/auth/login');
    expect(API_ROUTES.MOVIES.EPISODE_DETAIL('e1')).toBe('/episodes/e1');
    expect(API_ROUTES.MOVIES.LIST).toBe('/movies');
    expect(API_ROUTES.WALLET.INFO).toBe('/wallet');
    expect(API_ROUTES.WALLET.CHECK_IN).toBe('/wallet/check-in');
    expect(API_ROUTES.WALLET.STREAK).toBe('/wallet/streak');
    expect(API_ROUTES.SUBSCRIPTION.CURRENT).toBe('/subscription');
    expect(API_ROUTES.PRODUCTION.PROJECTS).toBe('/production-projects');
  });

  it('should have smart base URL configured', () => {
    expect(API_CONFIG.BASE_URL).toBeDefined();
    expect(API_CONFIG.TIMEOUT_MS).toBeGreaterThan(0);
  });
});

describe('API Adapters', () => {
  it('adaptUserProfile converts backend user properly', () => {
    const raw = {
      id: 'usr-123',
      fullName: 'Nguyễn Văn A',
      email: 'a@gmail.com',
      role: 'VIP',
    };
    const profile = adaptUserProfile(raw);
    expect(profile.id).toBe('usr-123');
    expect(profile.name).toBe('Nguyễn Văn A');
    expect(profile.role).toBe('vip');
    expect(profile.isVIP).toBe(true);
  });

  it('adaptUserProfile returns guest fallback if given null', () => {
    const profile = adaptUserProfile(null);
    expect(profile.id).toBe('user-guest');
    expect(profile.role).toBe('user');
  });

  it('adaptApiMovieToMovie formats movie structure for mobile UI', () => {
    const rawMovie = {
      id: 'mv-01',
      title: 'Neon Odyssey',
      synopsis: 'A journey through cyber space',
      releaseYear: 2026,
      episodes: [
        {
          id: 'ep-01',
          episodeNumber: 1,
          title: 'Khởi đầu',
          duration: '42:15',
          isFree: true,
        },
      ],
    };
    const movie = adaptApiMovieToMovie(rawMovie);
    expect(movie.id).toBe('mv-01');
    expect(movie.title).toBe('Neon Odyssey');
    expect(movie.description).toBe('A journey through cyber space');
    expect(movie.year).toBe(2026);
    expect(movie.episodes).toHaveLength(1);
    expect(movie.episodes[0].isFree).toBe(true);
  });

  it('adaptApiEpisodeToEpisode maps the backend catalog episode', () => {
    const ep = adaptApiEpisodeToEpisode({
      id: 'ep-1',
      seasonNumber: 2,
      episodeNumber: 3,
      title: 'Dạo phố Tokyo',
      availability: 'UNDER_REVISION',
      notice: 'Đang bảo trì',
      isFreeStarter: true,
      coinPrice: 3,
      durationSeconds: 3725,
      aiLabel: { labelType: 'AI_GENERATED', labelText: 'Phim được tạo bằng AI', displayLocation: null },
    });
    expect(ep.seasonNumber).toBe(2);
    expect(ep.isFree).toBe(true);
    expect(ep.price).toBe(3);
    expect(ep.duration).toBe('1:02:05');
    expect(ep.availability).toBe('UNDER_REVISION');
    expect(ep.notice).toBe('Đang bảo trì');
    expect(ep.aiLabel).toBe('Phim được tạo bằng AI');
  });

  it('formatDuration handles short and missing lengths', () => {
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(null)).toBe('');
  });

  it('movieService.getEpisodes calls the movie episodes endpoint', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ id: 'ep-1', episodeNumber: 1, coinPrice: 2 }]),
    } as Response);
    const res = await movieService.getEpisodes('mv-1');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/movies/mv-1/episodes');
    expect(res.data[0].price).toBe(2);
    jest.restoreAllMocks();
  });

  it('adaptApiWalletToWallet maps coins properly', () => {
    const wallet = adaptApiWalletToWallet({ mainBalance: 250, bonusBalance: 100 });
    expect(wallet.mainCoin).toBe(250);
    expect(wallet.bonusCoin).toBe(100);
  });

  it('date utils accurately calculates day index and labels', () => {
    // Wednesday 2026-09-23 -> index 2 (T4)
    const wed = new Date('2026-09-23T10:00:00');
    expect(wed.getDay()).toBe(3); // JavaScript Wed = 3
    expect(getTodayDayIndex(wed)).toBe(2);
    expect(VN_DAY_LABELS[getTodayDayIndex(wed)]).toBe('T4');

    // Sunday 2026-09-27 -> index 6 (CN)
    const sun = new Date('2026-09-27T10:00:00');
    expect(getTodayDayIndex(sun)).toBe(6);
    expect(VN_DAY_LABELS[getTodayDayIndex(sun)]).toBe('CN');

    // Monday 2026-09-21 -> index 0 (T2)
    const mon = new Date('2026-09-21T10:00:00');
    expect(getTodayDayIndex(mon)).toBe(0);
    expect(VN_DAY_LABELS[getTodayDayIndex(mon)]).toBe('T2');
  });

  it('adaptApiCheckInToStreak maps streak data properly with dynamic today', () => {
    const streak = adaptApiCheckInToStreak({
      streakCount: 3,
      lastCheckInDate: '2026-09-23',
      currentDay: 2, // Wednesday = T4
      todayClaimed: true,
    });
    expect(streak.currentStreak).toBe(3);
    expect(streak.todayClaimed).toBe(true);
    expect(streak.days).toHaveLength(7);
    expect(streak.days[2].dayLabel).toBe('T4');
    expect(streak.days[2].isToday).toBe(true);
    expect(streak.days[2].claimed).toBe(true);
    expect(streak.days[6].isToday).toBe(false);
  });

  it('adaptApiCheckInToStreak does not invent claims for an empty response', () => {
    const streak = adaptApiCheckInToStreak({});
    expect(streak.currentStreak).toBe(0);
    expect(streak.todayClaimed).toBe(false);
    expect(streak.days.every((day) => !day.claimed && day.reward === 0)).toBe(true);
  });

  it('adaptApiProjectToProject maps project data properly', () => {
    const rawProject = {
      id: 'proj-01',
      title: 'Thành Phố Tương Lai',
      status: 'IN_PRODUCTION',
      totalAiQuotaBudget: 5000,
      remainingAiQuotaBudget: 3500,
      assignedCreator: { fullName: 'Trần Minh Huy' },
    };
    const proj = adaptApiProjectToProject(rawProject);
    expect(proj.id).toBe('proj-01');
    expect(proj.status).toBe('in_production');
    expect(proj.totalBudgetTokens).toBe(5000);
    expect(proj.allocatedTokens).toBe(1500);
    expect(proj.creatorName).toBe('Trần Minh Huy');
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
    expect(res.message).toContain('network offline');
  });

  it('walletService.getWalletInfo reports the backend network error', async () => {
    const res = await walletService.getWalletInfo();
    expect(res.success).toBe(false);
    expect(res.message).toContain('network offline');
  });

  it('subscriptionService.getPlans reports the backend network error', async () => {
    const res = await subscriptionService.getPlans();
    expect(res.success).toBe(false);
    expect(res.message).toContain('network offline');
  });

  it('productionService.listProjects reports the backend network error', async () => {
    const res = await productionService.listProjects();
    expect(res.success).toBe(false);
    expect(res.message).toContain('network offline');
  });

  it('chatService.sendMessage reports the backend network error', async () => {
    const res = await chatService.sendMessage('Xin chào');
    expect(res.success).toBe(false);
    expect(res.message).toContain('network offline');
  });
});

describe('Live Backend Connection (Port 3001)', () => {
  it('successfully handles production-projects endpoint response structure', async () => {
    const res = await apiClient.get('/production-projects');
    if (res.success) {
      expect(res.statusCode).toBe(200);
      expect(res.data).toBeDefined();
    } else {
      expect([401, 404, undefined]).toContain(res.statusCode);
    }
  });

  it('successfully handles real genres list from live NestJS BE', async () => {
    const res = await apiClient.get<Array<{ id: string; name: string }>>('/genres');
    if (res.success) {
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data?.length).toBeGreaterThan(0);
      expect(res.data?.[0]?.name).toBeDefined();
    } else {
      expect(res.statusCode).toBeUndefined();
    }
  });

  it('successfully handles real policies from live NestJS BE', async () => {
    const res = await apiClient.get<any[]>('/policies');
    if (res.success) {
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data?.length).toBeGreaterThan(0);
    } else {
      expect([401, undefined]).toContain(res.statusCode);
    }
  });

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
    expect(res.message).toContain('Web Studio');
    expect(String(fetchMock.mock.calls[1][0])).toContain('/auth/logout');
    expect(await storage.getString(STORAGE_KEYS.AUTH_TOKEN, '')).toBe('');
    jest.restoreAllMocks();
  });

  it('authService.login returns 401 with real BE error for wrong password', async () => {
    const res = await authService.login({ email: 'nonexistent_test@example.com', password: 'wrongpassword' });
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it('authService.register reports duplicate email from backend', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: 'Email already exists' }),
    } as Response);
    const res = await authService.register({
      name: 'Test Duplicate',
      email: 'test_node_check@example.com',
      password: 'password123',
    });
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(409);
    expect(res.message).toMatch(/(email already|exists|tồn tại)/i);
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
    });
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.message).toBe('email must be an email');
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
    expect(extractErrorMessage({ error: { message: 'Conflict', details: ['a', 'b'] } })).toBe('a, b');
    expect(extractErrorMessage({ error: { message: 'Email already exists' } })).toBe('Email already exists');
    expect(extractErrorMessage({ message: ['x', 'y'] })).toBe('x, y');
    expect(extractErrorMessage(null)).toBeUndefined();
  });
});
