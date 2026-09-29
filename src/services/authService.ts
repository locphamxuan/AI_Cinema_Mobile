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

    // Kết nối trực tiếp tới Backend NestJS (/api/auth/login)
    const res = await apiClient.post<AuthResponseDto>(
      API_ROUTES.AUTH.LOGIN,
      {
        email: trimmedEmail,
        password: dto.password,
      }
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
      }
    );

    if (res.success && res.data?.user) {
      // 2. Tự động đăng nhập để lấy accessToken thật từ Backend
      if (dto.password) {
        try {
          const loginRes = await apiClient.post<AuthResponseDto>(
            API_ROUTES.AUTH.LOGIN,
            { email: trimmedEmail, password: dto.password },
            {}
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
      undefined
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
