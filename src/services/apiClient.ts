import { API_CONFIG } from '../constants/config';
import { storage, STORAGE_KEYS } from '../lib/storage';
import type { ApiResponse } from '../types/api';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
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
    const { body, params, timeoutMs = API_CONFIG.TIMEOUT_MS, headers: customHeaders, ...restOptions } = options;
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

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errJson = await response.json();
          console.error(`[API Error Response] ${response.status} ${url}:`, errJson);
          if (errJson?.message) {
            errorMessage = Array.isArray(errJson.message) ? errJson.message.join(', ') : errJson.message;
          }
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

      const data = await response.json();
      console.log(`[API Success] ${url}`, data);
      return {
        success: true,
        data: data?.data !== undefined ? data.data : data,
        statusCode: response.status,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error(`[API Network Exception] ${url}:`, err);
      return {
        success: false,
        data: null as unknown as T,
        message: err?.name === 'AbortError' ? 'Yêu cầu kết nối quá thời gian quy định (Timeout)' : (err?.message || 'Lỗi kết nối mạng máy chủ'),
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
