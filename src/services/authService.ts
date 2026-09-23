import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { storage, STORAGE_KEYS } from '../lib/storage';
import type { ApiResponse, AuthResponseDto, LoginRequestDto, RegisterRequestDto } from '../types/api';
import type { UserProfile } from '../types/auth';

class AuthService {
  async login(dto: LoginRequestDto): Promise<ApiResponse<AuthResponseDto>> {
    const res = await apiClient.post<AuthResponseDto>(
      API_ROUTES.AUTH.LOGIN,
      dto,
      undefined,
      // Fallback
      async () => {
        const isMaker = dto.email.toLowerCase().includes('maker') || dto.email.toLowerCase().includes('creator');
        const isChecker = dto.email.toLowerCase().includes('checker') || dto.email.toLowerCase().includes('reviewer');
        const role = isChecker ? 'checker' : isMaker ? 'maker' : 'user';

        return {
          user: {
            id: `usr-${Date.now()}`,
            email: dto.email,
            fullName: isChecker ? 'Kiểm Duyệt Viên' : isMaker ? 'Đạo Diễn AI' : 'Khán Giả VIP',
            role,
            isVip: true,
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
          },
          accessToken: `mock-jwt-token-${Date.now()}`,
        };
      }
    );

    if (res.success && res.data?.accessToken) {
      await storage.set(STORAGE_KEYS.AUTH_TOKEN, res.data.accessToken);
      if (res.data.user) {
        await storage.set(STORAGE_KEYS.USER_DATA, res.data.user);
      }
    }

    return res;
  }

  async register(dto: RegisterRequestDto): Promise<ApiResponse<AuthResponseDto>> {
    const res = await apiClient.post<AuthResponseDto>(
      API_ROUTES.AUTH.REGISTER,
      dto,
      undefined,
      async () => ({
        user: {
          id: `usr-${Date.now()}`,
          email: dto.email,
          fullName: dto.name,
          role: 'user',
          isVip: false,
        },
        accessToken: `mock-jwt-token-${Date.now()}`,
      })
    );

    if (res.success && res.data?.accessToken) {
      await storage.set(STORAGE_KEYS.AUTH_TOKEN, res.data.accessToken);
      if (res.data.user) {
        await storage.set(STORAGE_KEYS.USER_DATA, res.data.user);
      }
    }

    return res;
  }

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>(
      API_ROUTES.AUTH.PROFILE,
      undefined,
      async () => {
        const saved = await storage.get<UserProfile | null>(STORAGE_KEYS.USER_DATA, null);
        return saved || {
          id: 'usr-default',
          email: 'user@aicinema.vn',
          name: 'Khán Giả AI Cinema',
          role: 'user' as const,
          isVIP: true,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
          createdAt: new Date().toISOString(),
        };
      }
    );
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ROUTES.AUTH.LOGOUT);
    } catch {
      // ignore
    } finally {
      await storage.remove(STORAGE_KEYS.AUTH_TOKEN);
      await storage.remove(STORAGE_KEYS.USER_DATA);
    }
  }
}

export const authService = new AuthService();
