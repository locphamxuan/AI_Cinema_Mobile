import { API_CONFIG } from '../constants/config';
import { storage, STORAGE_KEYS } from '../lib/storage';
import type { ApiResponse } from '../types/api';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  useMockFallback?: boolean;
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
    options: RequestOptions = {},
    mockFallbackFn?: () => Promise<T> | T
  ): Promise<ApiResponse<T>> {
    const { body, params, timeoutMs = API_CONFIG.TIMEOUT_MS, headers: customHeaders, ...restOptions } = options;
    const url = this.buildUrl(endpoint, params);
    const authHeaders = await this.getAuthHeaders();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    const shouldFallback = options.useMockFallback ?? isTest;

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

      if (!response.ok) {
        if (shouldFallback && mockFallbackFn && options.useMockFallback !== false) {
          try {
            const fallbackData = await mockFallbackFn();
            return {
              success: true,
              data: fallbackData,
              statusCode: 200,
              message: 'Fallback to mock data (Server responded with error)',
            };
          } catch {
            // ignore mock error
          }
        }

        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson?.message) {
            errorMessage = Array.isArray(errJson.message) ? errJson.message.join(', ') : errJson.message;
          }
        } catch {
          // Non-JSON response
        }

        return {
          success: false,
          data: null as unknown as T,
          message: errorMessage,
          statusCode: response.status,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data?.data !== undefined ? data.data : data,
        statusCode: response.status,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (shouldFallback && mockFallbackFn && options.useMockFallback !== false) {
        try {
          const fallbackData = await mockFallbackFn();
          return {
            success: true,
            data: fallbackData,
            statusCode: 200,
            message: 'Fallback to mock data (Network unreachable)',
          };
        } catch {
          // ignore mock error
        }
      }

      return {
        success: false,
        data: null as unknown as T,
        message: err?.name === 'AbortError' ? 'Yêu cầu kết nối quá thời gian quy định (Timeout)' : (err?.message || 'Lỗi kết nối mạng máy chủ'),
      };
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions, mockFallbackFn?: () => Promise<T> | T) {
    return this.request<T>(endpoint, { ...options, method: 'GET' }, mockFallbackFn);
  }

  public post<T>(endpoint: string, body?: any, options?: RequestOptions, mockFallbackFn?: () => Promise<T> | T) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body }, mockFallbackFn);
  }

  public put<T>(endpoint: string, body?: any, options?: RequestOptions, mockFallbackFn?: () => Promise<T> | T) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body }, mockFallbackFn);
  }

  public patch<T>(endpoint: string, body?: any, options?: RequestOptions, mockFallbackFn?: () => Promise<T> | T) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body }, mockFallbackFn);
  }

  public delete<T>(endpoint: string, options?: RequestOptions, mockFallbackFn?: () => Promise<T> | T) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' }, mockFallbackFn);
  }
}

export const apiClient = new ApiClient();
