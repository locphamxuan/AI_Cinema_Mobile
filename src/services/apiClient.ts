import { API_CONFIG } from '../constants/config';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { tokenExpiresSoon } from '../lib/jwt';
import type { ApiResponse } from '../types/api';
import { inVietnamese } from '../lib/apiMessages';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Sent as is when a string, otherwise as JSON. */
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  /** Set on the retry after a token refresh (and on auth calls) so a 401 is not retried again. */
  skipAuthRefresh?: boolean;
  /**
   * Refresh an expiring token before the call, but never refresh-and-retry after a 401: for a call whose 401 means
   * "wrong password", a retry would only spend a second try of the BE rate limit.
   */
  noRetryOn401?: boolean;
  /** Keep a paginated `{ data, meta }` body whole instead of unwrapping it to the rows. */
  keepEnvelope?: boolean;
}

interface SessionTokens {
  accessToken?: string;
  refreshToken?: string;
}

/** The API answers in English: each part is worded in Vietnamese, and one it cannot word is left out. */
const joinMessage = (value: unknown): string | undefined => {
  const parts = (Array.isArray(value) ? value : [value])
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .map((part) => inVietnamese(part, ''))
    .filter(Boolean);
  return parts.length ? [...new Set(parts)].join(' ') : undefined;
};

/** What a refusal means when the API said nothing the member can read. */
export function statusMessage(status: number): string {
  if (status === 400 || status === 422) return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.';
  if (status === 401) return 'Hết hạn đăng nhập, vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return 'Không tìm thấy nội dung này.';
  if (status === 409) return 'Dữ liệu vừa thay đổi. Vui lòng tải lại rồi thử lại.';
  if (status === 429) return 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.';
  if (status >= 500) return 'Hệ thống đang bận. Vui lòng thử lại sau.';
  return 'Không thực hiện được thao tác này. Vui lòng thử lại.';
}

export const NETWORK_MESSAGE = 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
export const TIMEOUT_MESSAGE = 'Máy chủ phản hồi quá lâu. Kiểm tra mạng rồi thử lại.';

/** Refusals the viewer can act on, keyed by the BE `details.reason` (Main Flow 3). */
const REASON_MESSAGES: Record<string, string> = {
  GOOGLE_STAFF_ACCOUNT: 'Đăng nhập bằng Google chỉ dành cho người xem. Tài khoản quản trị và nhân viên hãy đăng nhập bằng mật khẩu.',
  GOOGLE_EMAIL_REGISTERED: 'Email này đã có tài khoản. Hãy đăng nhập bằng mật khẩu.',
  GOOGLE_ACCOUNT_MISMATCH: 'Email này đã được liên kết với một tài khoản Google khác.',
  GOOGLE_TERMS_REQUIRED: 'Hãy đồng ý Điều khoản sử dụng để tạo tài khoản.',
  CONCURRENT_LIMIT_REACHED: 'Tài khoản đang xem trên quá nhiều thiết bị cùng lúc. Hãy dừng xem ở thiết bị khác rồi thử lại.',
  DEVICE_LIMIT_REACHED: 'Tài khoản đã đăng ký đủ số thiết bị của gói. Hãy gỡ bớt một thiết bị để xem trên máy này.',
  DEVICE_ID_REQUIRED: 'Không nhận diện được thiết bị. Hãy mở lại ứng dụng rồi thử lại.',
  DEVICE_PLATFORM_NOT_SUPPORTED: 'Tài khoản người xem chỉ xem phim được trên điện thoại Android. Hãy mở ứng dụng AI Cinema trên điện thoại Android.',
  MEDIA_NOT_READY: 'Tập phim chưa sẵn sàng để phát. Vui lòng quay lại sau.',
  EPISODE_UNDER_REVISION: 'Tập phim đang được chỉnh sửa, vui lòng quay lại sau.',
  PLAYBACK_ACCESS_REQUIRED: 'Bạn chưa có quyền xem tập này. Hãy mở khóa tập hoặc đăng ký gói.',
  PLAYBACK_ACCESS_REVOKED: 'Quyền xem tập này đã hết hiệu lực.',
  // BR-69 watch-room gate
  DEVICE_LIMIT_EXCEEDED: 'Tài khoản đang phát trên đủ số thiết bị của gói. Dừng xem ở một thiết bị rồi vào phòng lại.',
  ENTITLEMENT_REQUIRED: 'Bạn chưa có quyền xem tập này. Mở khóa tập hoặc đăng ký gói Tháng để vào phòng.',
  AGE_RESTRICTED: 'Tập này dành cho người từ 18 tuổi trở lên.',
  ROOM_FULL: 'Phòng đã đủ 8 người.',
  GUEST_KEY_REQUIRED: 'Lượt xem đã hết hạn. Mở lại tập phim để xem tiếp.',
  GUEST_KEY_INVALID: 'Lượt xem đã hết hạn. Mở lại tập phim để xem tiếp.',
};

/** The BE error envelope; `details` is a list of validation messages or a `{ reason }` object. */
interface ErrorBody {
  message?: unknown;
  error?: { code?: string; message?: unknown; details?: unknown };
}

const reasonOf = (body: ErrorBody | null | undefined): string | undefined => {
  const details = body?.error?.details;
  if (!details || typeof details !== 'object' || Array.isArray(details)) return undefined;
  const reason = (details as { reason?: unknown }).reason;
  return typeof reason === 'string' ? reason : undefined;
};

/**
 * The backend wraps errors as `{ error: { code, message, details[] } }`; validation details
 * are more useful to the user than the generic message. Plain `{ message }` is still accepted.
 */
export const extractErrorMessage = (body: ErrorBody | null | undefined): string | undefined => {
  const reason = reasonOf(body);
  return (
    (reason ? REASON_MESSAGES[reason] : undefined) ??
    joinMessage(body?.error?.details) ??
    joinMessage(body?.error?.message) ??
    joinMessage(body?.message)
  );
};

class ApiClient {
  private readonly baseUrl: string;
  private refreshInFlight: Promise<boolean> | null = null;
  private sessionExpiredHandler: (() => void) | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /** Called when the refresh token is rejected, so the app can drop its signed-in state. */
  public onSessionExpired(handler: () => void) {
    this.sessionExpiredHandler = handler;
  }

  public async saveSession({ accessToken, refreshToken }: SessionTokens): Promise<void> {
    if (accessToken) await storage.set(STORAGE_KEYS.AUTH_TOKEN, accessToken);
    if (refreshToken) await storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  public async clearSession(): Promise<void> {
    await Promise.all([
      storage.remove(STORAGE_KEYS.AUTH_TOKEN),
      storage.remove(STORAGE_KEYS.REFRESH_TOKEN),
      storage.remove(STORAGE_KEYS.USER_DATA),
    ]);
  }

  /**
   * Access tokens live 15 minutes; swap the refresh token for a new pair (single-use, so
   * concurrent 401s share one refresh). Returns false when there is no usable session.
   */
  private refreshSession(): Promise<boolean> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = (async () => {
        const refreshToken = await storage.getString(STORAGE_KEYS.REFRESH_TOKEN, '');
        if (!refreshToken) return false;

        const res = await this.request<SessionTokens>('/auth/refresh', {
          method: 'POST',
          body: { refreshToken },
          skipAuthRefresh: true,
        });
        if (res.success && res.data?.accessToken) {
          await this.saveSession(res.data);
          return true;
        }
        // A timeout or network error is not proof that the session is gone.
        if (res.statusCode === 401 || res.statusCode === 400) {
          await this.clearSession();
          this.sessionExpiredHandler?.();
        }
        return false;
      })().finally(() => {
        this.refreshInFlight = null;
      });
    }
    return this.refreshInFlight;
  }

  /** The stored access token, refreshed first when it has expired (the watch-room socket handshake). */
  public async getFreshAccessToken(): Promise<string> {
    const token = await storage.getString(STORAGE_KEYS.AUTH_TOKEN, '');
    if (token && tokenExpiresSoon(token) && (await this.refreshSession())) {
      return storage.getString(STORAGE_KEYS.AUTH_TOKEN, '');
    }
    return token;
  }

  /** A new access token now (the server refused the current one), or '' when the session cannot be renewed. */
  public async refreshAccessToken(): Promise<string> {
    return (await this.refreshSession()) ? storage.getString(STORAGE_KEYS.AUTH_TOKEN, '') : '';
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async getAuthHeaders(skipAuthRefresh = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      ...API_CONFIG.DEFAULT_HEADERS,
    };

    try {
      let token = await storage.getString(STORAGE_KEYS.AUTH_TOKEN, '');
      // Public routes (access, playback, engagement) read an expired token as a Guest rather than answering 401.
      if (token && !skipAuthRefresh && tokenExpiresSoon(token) && (await this.refreshSession())) {
        token = await storage.getString(STORAGE_KEYS.AUTH_TOKEN, '');
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Storage access error, continue without auth header
    }

    return headers;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${this.baseUrl}${cleanEndpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    return url;
  }

  public async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      body,
      params,
      timeoutMs = API_CONFIG.TIMEOUT_MS,
      headers: customHeaders,
      skipAuthRefresh = false,
      noRetryOn401 = false,
      keepEnvelope = false,
      ...restOptions
    } = options;
    const url = this.buildUrl(endpoint, params);
    const authHeaders = await this.getAuthHeaders(skipAuthRefresh);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const requestInit: RequestInit = {
        ...restOptions,
        headers: {
          ...authHeaders,
          ...(customHeaders as Record<string, string>),
        },
        signal: controller.signal,
      };

      if (body) {
        requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, requestInit);
      clearTimeout(timeoutId);

      if (response.status === 401 && !skipAuthRefresh && !noRetryOn401 && (await this.refreshSession())) {
        return this.request<T>(endpoint, { ...options, skipAuthRefresh: true });
      }

      if (!response.ok) {
        let errorMessage = statusMessage(response.status);
        let reason: string | undefined;
        try {
          const errJson = (await response.json()) as ErrorBody | null;
          errorMessage = extractErrorMessage(errJson) || errorMessage;
          reason = reasonOf(errJson);
        } catch {
          // Keep the returned status/message useful without logging response bodies or URLs.
        }

        return {
          success: false,
          data: null as unknown as T,
          message: errorMessage,
          statusCode: response.status,
          reason,
        };
      }

      // 204 No Content (e.g. logout) has no body to parse.
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      return {
        success: true,
        data: data?.data !== undefined && !keepEnvelope ? data.data : data,
        statusCode: response.status,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      // An abort can surface as a DOMException-like object, so read name/message without instanceof.
      const failure = typeof err === 'object' && err !== null ? (err as { name?: string; message?: string }) : null;
      const isTimeout = failure?.name === 'AbortError';
      return {
        success: false,
        data: null as unknown as T,
        // The browser / native text ("Network request failed") means nothing to a viewer.
        message: isTimeout ? TIMEOUT_MESSAGE : NETWORK_MESSAGE,
      };
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  public delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
