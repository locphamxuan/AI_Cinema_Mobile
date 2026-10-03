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

    try {
      // Kết nối trực tiếp tới Backend NestJS (/api/auth/login)
      const res = await apiClient.post<AuthResponseDto>(
        API_ROUTES.AUTH.LOGIN,
        {
          email: trimmedEmail,
          password: dto.password,
        }
      );

      const token = res.data?.accessToken || res.data?.token;
      const user = res.data?.user;

      if (res.success && (token || user)) {
        if (token) {
          await storage.set(STORAGE_KEYS.AUTH_TOKEN, token);
        }
        if (user) {
          await storage.set(STORAGE_KEYS.USER_DATA, user);
        }
        return {
          ...res,
          data: {
            ...res.data,
            accessToken: token,
            token,
            user,
          },
        };
      }

      return {
        success: false,
        data: null as unknown as AuthResponseDto,
        message: res.message || 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!',
        statusCode: res.statusCode || 401,
      };
    } catch (err: any) {
      return {
        success: false,
        data: null as unknown as AuthResponseDto,
        message: err?.message || 'Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra lại kết nối mạng!',
        statusCode: 500,
      };
    }
  }

  async register(dto: RegisterRequestDto): Promise<ApiResponse<AuthResponseDto>> {
    const trimmedEmail = dto.email.trim().toLowerCase();
    const fullName = (dto.fullName || dto.name || '').trim();
    const dateOfBirth = (dto.dateOfBirth || '2003-05-14').trim();

    try {
      // 1. Gửi request tạo tài khoản tới Backend NestJS (/api/auth/register) -> lưu vào Neon PostgreSQL
      const res = await apiClient.post<AuthResponseDto>(
        API_ROUTES.AUTH.REGISTER,
        {
          email: trimmedEmail,
          password: dto.password,
          fullName,
          dateOfBirth,
        }
      );

      const token = res.data?.accessToken || res.data?.token;
      const user = res.data?.user || (res.data?.id || res.data?.email ? res.data : null);

      if (res.success) {
        if (token) {
          await storage.set(STORAGE_KEYS.AUTH_TOKEN, token);
        }
        if (user) {
          await storage.set(STORAGE_KEYS.USER_DATA, user);
        }

        if (token || user) {
          return {
            ...res,
            data: {
              ...res.data,
              accessToken: token,
              token,
              user: user || res.data,
            },
          };
        }

        // 2. Tự động đăng nhập để lấy token thật từ Backend nếu register chưa trả về token
        if (dto.password) {
          try {
            const loginRes = await this.login({ email: trimmedEmail, password: dto.password });
            if (loginRes.success && loginRes.data) {
              return loginRes;
            }
          } catch {
            // Bỏ qua lỗi login phụ nếu có
          }
        }

        return res;
      }

      return {
        success: false,
        data: null as unknown as AuthResponseDto,
        message: res.message || 'Đăng ký không thành công. Vui lòng thử lại!',
        statusCode: res.statusCode || 400,
      };
    } catch (err: any) {
      return {
        success: false,
        data: null as unknown as AuthResponseDto,
        message: err?.message || 'Không thể kết nối đến máy chủ khi đăng ký.',
        statusCode: 500,
      };
    }
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
