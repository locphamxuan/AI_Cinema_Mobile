import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { storage, STORAGE_KEYS } from '../lib/storage';
import type { ApiResponse, AuthResponseDto, LoginRequestDto, RegisterRequestDto } from '../types/api';
import type { UserProfile } from '../types/auth';

class AuthService {
  async login(dto: LoginRequestDto): Promise<ApiResponse<AuthResponseDto>> {
    const trimmedEmail = dto.email.trim().toLowerCase();

    // 1. Chặn Maker / Checker trên Mobile - chỉ hỗ trợ trên Web Studio
    if (trimmedEmail === 'creator@gmail.com' || trimmedEmail === 'reviewer@gmail.com') {
      return {
        success: false,
        data: null as unknown as AuthResponseDto,
        message: 'Tài khoản Sản xuất & Kiểm duyệt (Maker/Checker) chỉ hỗ trợ trên phiên bản Web Studio máy tính. Ứng dụng di động chỉ dành riêng cho Khán giả!',
        statusCode: 403,
      };
    }

    // 2. Fast-path cho tài khoản demo với mật khẩu '1' (tránh 400 Bad Request do BE yêu cầu tối thiểu 8 ký tự)
    if (dto.password === '1') {
      if (trimmedEmail === 'userdemo@gmail.com') {
        const demoUser = {
          id: '7315fdbf-081a-4f18-9273-41b50dc93928',
          email: 'userdemo@gmail.com',
          fullName: 'Phạm Xuân Lộc (Khán Giả)',
          name: 'Phạm Xuân Lộc (Khán Giả)',
          role: 'user',
          isVip: false,
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        };
        const demoToken = 'mock_jwt_token_demo_user';
        await storage.set(STORAGE_KEYS.AUTH_TOKEN, demoToken);
        await storage.set(STORAGE_KEYS.USER_DATA, demoUser);
        return {
          success: true,
          data: {
            user: demoUser,
            accessToken: demoToken,
            message: 'Đăng nhập thành công với tài khoản demo Khán Giả',
          },
          statusCode: 200,
        };
      }

      if (trimmedEmail === 'vipdemo@gmail.com') {
        const demoVipUser = {
          id: 'fe9b4427-c5b0-4b3a-85f0-4406d56eb3b6',
          email: 'vipdemo@gmail.com',
          fullName: 'Phạm Xuân Lộc (Khán Giả VIP)',
          name: 'Phạm Xuân Lộc (Khán Giả VIP)',
          role: 'vip',
          isVip: true,
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        };
        const demoToken = 'mock_jwt_token_demo_vip';
        await storage.set(STORAGE_KEYS.AUTH_TOKEN, demoToken);
        await storage.set(STORAGE_KEYS.USER_DATA, demoVipUser);
        return {
          success: true,
          data: {
            user: demoVipUser,
            accessToken: demoToken,
            message: 'Đăng nhập thành công với tài khoản demo Khán Giả VIP',
          },
          statusCode: 200,
        };
      }
    }

    // 3. Kết nối trực tiếp tới Backend NestJS thật (/api/auth/login)
    const res = await apiClient.post<AuthResponseDto>(
      API_ROUTES.AUTH.LOGIN,
      {
        email: trimmedEmail,
        password: dto.password,
      },
      { useMockFallback: false }
    );

    if (res.success && res.data?.accessToken) {
      await storage.set(STORAGE_KEYS.AUTH_TOKEN, res.data.accessToken);
      if (res.data.user) {
        await storage.set(STORAGE_KEYS.USER_DATA, res.data.user);
      }
      return res;
    }

    return {
      success: false,
      data: null as unknown as AuthResponseDto,
      message: res.message || 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!',
      statusCode: res.statusCode || 401,
    };
  }

  async register(dto: RegisterRequestDto): Promise<ApiResponse<AuthResponseDto>> {
    const trimmedEmail = dto.email.trim().toLowerCase();
    const fullName = (dto.fullName || dto.name || '').trim();

    // 1. Gửi request tạo tài khoản tới Backend NestJS (/api/auth/register) -> lưu vào Neon PostgreSQL
    const res = await apiClient.post<AuthResponseDto>(
      API_ROUTES.AUTH.REGISTER,
      {
        email: trimmedEmail,
        password: dto.password,
        fullName,
        name: fullName,
        role: 'MEMBER',
      },
      { useMockFallback: false }
    );

    if (res.success && res.data?.user) {
      // 2. Tự động đăng nhập để lấy accessToken thật từ Backend
      if (dto.password) {
        try {
          const loginRes = await apiClient.post<AuthResponseDto>(
            API_ROUTES.AUTH.LOGIN,
            { email: trimmedEmail, password: dto.password },
            { useMockFallback: false }
          );

          if (loginRes.success && loginRes.data?.accessToken) {
            await storage.set(STORAGE_KEYS.AUTH_TOKEN, loginRes.data.accessToken);
            await storage.set(STORAGE_KEYS.USER_DATA, loginRes.data.user);
            return {
              success: true,
              data: {
                message: res.data.message || 'Đăng ký thành công',
                user: loginRes.data.user,
                accessToken: loginRes.data.accessToken,
              },
              statusCode: 201,
            };
          }
        } catch {
          // Bỏ qua lỗi login phụ nếu có
        }
      }

      await storage.set(STORAGE_KEYS.USER_DATA, res.data.user);
      return res;
    }

    return {
      success: false,
      data: null as unknown as AuthResponseDto,
      message: res.message || 'Đăng ký không thành công. Vui lòng thử lại!',
      statusCode: res.statusCode || 400,
    };
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
      await apiClient.post(API_ROUTES.AUTH.LOGOUT, undefined, { useMockFallback: false });
    } catch {
      // ignore
    } finally {
      await storage.remove(STORAGE_KEYS.AUTH_TOKEN);
      await storage.remove(STORAGE_KEYS.USER_DATA);
    }
  }
}

export const authService = new AuthService();
