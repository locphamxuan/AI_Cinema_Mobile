import { API_CONFIG } from '../constants/config';
import { storage, STORAGE_KEYS } from '../lib/storage';
import type { ApiResponse } from '../types/api';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  /** Set on the retry after a token refresh (and on auth calls) so a 401 is not retried again. */
  skipAuthRefresh?: boolean;
}

interface SessionTokens {
  accessToken?: string;
  refreshToken?: string;
}

const joinMessage = (value: unknown): string | undefined => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : undefined;
  return typeof value === 'string' && value ? value : undefined;
};

/**
 * The backend wraps errors as `{ error: { code, message, details[] } }`; validation details
 * are more useful to the user than the generic message. Plain `{ message }` is still accepted.
 */
export const extractErrorMessage = (body: any): string | undefined =>
  joinMessage(body?.error?.details) ?? joinMessage(body?.error?.message) ?? joinMessage(body?.message);

class ApiClient {
  private baseUrl: string;
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

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      ...API_CONFIG.DEFAULT_HEADERS,
    };

    try {
      const token = await storage.getString(STORAGE_KEYS.AUTH_TOKEN, '');
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

  public async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      body,
      params,
      timeoutMs = API_CONFIG.TIMEOUT_MS,
      headers: customHeaders,
      skipAuthRefresh = false,
      ...restOptions
    } = options;
    const url = this.buildUrl(endpoint, params);
    const authHeaders = await this.getAuthHeaders();

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

      console.log(`[API Request] ${options.method || 'GET'} ${url}`, body ? { body } : '');

      const response = await fetch(url, requestInit);
      clearTimeout(timeoutId);

      if (response.status === 401 && !skipAuthRefresh && (await this.refreshSession())) {
        return this.request<T>(endpoint, { ...options, skipAuthRefresh: true });
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errJson = await response.json();
          console.error(`[API Error Response] ${response.status} ${url}:`, errJson);
          errorMessage = extractErrorMessage(errJson) || errorMessage;
        } catch (e) {
          console.error(`[API Error Non-JSON] ${response.status} ${url}:`, e);
        }

        return {
          success: false,
          data: null as unknown as T,
          message: errorMessage,
          statusCode: response.status,
        };
      }

      // 204 No Content (e.g. logout) has no body to parse.
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      console.log(`[API Success] ${url}`, data);
      return {
        success: true,
        data: data?.data !== undefined ? data.data : data,
        statusCode: response.status,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err?.name === 'AbortError';
      console.error(`[API ${isTimeout ? 'Timeout' : 'Network Exception'}] ${url}:`, err);
      return {
        success: false,
        data: null as unknown as T,
        message: isTimeout ? 'Yêu cầu kết nối quá thời gian quy định (Timeout)' : (err?.message || 'Lỗi kết nối mạng máy chủ'),
      };
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  public put<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  public patch<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  public delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
