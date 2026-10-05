import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { adaptUserProfile } from '../lib/apiAdapter';
import type { ApiResponse, AuthResponseDto, LoginRequestDto, RegisterRequestDto } from '../types/api';
import type { UserProfile } from '../types/auth';

// Auth calls answer 401 for bad credentials; that must not trigger a token refresh.
const AUTH_CALL = { skipAuthRefresh: true } as const;

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
      { email: trimmedEmail, password: dto.password },
      AUTH_CALL
    );

    const token = res.data?.accessToken || res.data?.token;
    const user = res.data?.user;

    if (res.success && token && user) {
      await apiClient.saveSession({ accessToken: token, refreshToken: res.data.refreshToken });
      await storage.set(STORAGE_KEYS.USER_DATA, user);
      return { ...res, data: { ...res.data, accessToken: token, token, user } };
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
    const dateOfBirth = (dto.dateOfBirth || '2003-05-14').trim();

    // Gửi request tạo tài khoản tới Backend NestJS (/api/auth/register) -> lưu vào Neon PostgreSQL
    const res = await apiClient.post<AuthResponseDto>(
      API_ROUTES.AUTH.REGISTER,
      { email: trimmedEmail, password: dto.password, fullName, dateOfBirth },
      AUTH_CALL
    );

    if (res.success) {
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
    const res = await apiClient.get<unknown>(API_ROUTES.AUTH.PROFILE);
    return { ...res, data: res.success ? adaptUserProfile(res.data) : (null as unknown as UserProfile) };
  }

  /** Revokes the refresh token on the backend, then forgets the local session either way. */
  async logout(): Promise<void> {
    const refreshToken = await storage.getString(STORAGE_KEYS.REFRESH_TOKEN, '');
    if (refreshToken) {
      await apiClient.post(API_ROUTES.AUTH.LOGOUT, { refreshToken }, AUTH_CALL);
    }
    await apiClient.clearSession();
  }
}

export const authService = new AuthService();
