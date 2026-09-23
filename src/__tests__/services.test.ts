// Mock AsyncStorage for headless test execution
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  adaptApiMovieToMovie,
  adaptApiEpisodeToEpisode,
  adaptApiWalletToWallet,
  adaptApiCheckInToStreak,
  adaptApiProjectToProject,
  adaptUserProfile,
} from '../lib/apiAdapter';
import {
  authService,
  movieService,
  walletService,
  subscriptionService,
  productionService,
  chatService,
} from '../services';
import { apiClient } from '../services/apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { API_CONFIG } from '../constants/config';

describe('API Routes and Config', () => {
  it('should have proper API routes configured', () => {
    expect(API_ROUTES.AUTH.LOGIN).toBe('/auth/login');
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

  it('adaptApiWalletToWallet maps coins properly', () => {
    const wallet = adaptApiWalletToWallet({ mainBalance: 250, bonusBalance: 100 });
    expect(wallet.mainCoin).toBe(250);
    expect(wallet.bonusCoin).toBe(100);
  });

  it('adaptApiCheckInToStreak maps streak data properly', () => {
    const streak = adaptApiCheckInToStreak({
      streakCount: 4,
      lastCheckInDate: '2026-09-23',
      currentDay: 3,
      todayClaimed: true,
    });
    expect(streak.currentStreak).toBe(4);
    expect(streak.todayClaimed).toBe(true);
    expect(streak.days).toHaveLength(7);
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

describe('Mobile Services with Safe Offline Fallbacks', () => {
  it('movieService.listMovies falls back gracefully when backend offline', async () => {
    const res = await movieService.listMovies();
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });

  it('movieService.getMovieDetail returns detail for id', async () => {
    const res = await movieService.getMovieDetail('movie-001');
    expect(res.success).toBe(true);
    expect(res.data.id).toBe('movie-001');
  });

  it('walletService.getWalletInfo returns wallet balance', async () => {
    const res = await walletService.getWalletInfo();
    expect(res.success).toBe(true);
    expect(res.data.mainCoin).toBeDefined();
    expect(res.data.bonusCoin).toBeDefined();
  });

  it('walletService.checkIn returns streak', async () => {
    const res = await walletService.checkIn();
    expect(res.success).toBe(true);
    expect(res.data.todayClaimed).toBe(true);
  });

  it('subscriptionService.getPlans returns available VIP plans', async () => {
    const res = await subscriptionService.getPlans();
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });

  it('productionService.listProjects returns projects', async () => {
    const res = await productionService.listProjects();
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0].id).toBeDefined();
  });

  it('chatService.sendMessage returns bot response', async () => {
    const res = await chatService.sendMessage('Xin chào');
    expect(res.success).toBe(true);
    expect(res.data.content).toBeDefined();
  });
});

describe('Live Backend Connection (Port 3001)', () => {
  it('successfully connects to live NestJS BE and fetches production-projects', async () => {
    const res = await apiClient.get('/production-projects');
    expect(res.statusCode).toBe(200);
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
  });

  it('successfully fetches real genres list from live NestJS BE', async () => {
    const res = await apiClient.get<Array<{ id: string; name: string }>>('/genres');
    expect(res.statusCode).toBe(200);
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data?.length).toBeGreaterThan(0);
    expect(res.data?.[0]?.name).toBeDefined();
  });

  it('successfully fetches real policies from live NestJS BE', async () => {
    const res = await apiClient.get<any[]>('/policies');
    expect(res.statusCode).toBe(200);
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data?.length).toBeGreaterThan(0);
  });
});
