/**
 * Standard API Response and Request Types for AI Cinema Mobile
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  statusCode?: number;
  /** The BE `error.details.reason` of a refusal, e.g. DEVICE_LIMIT_REACHED. */
  reason?: string;
  errors?: Record<string, string[]>;
}

// Auth DTOs
export interface LoginRequestDto {
  email: string;
  password?: string;
}

export interface RegisterRequestDto {
  name?: string;
  fullName?: string;
  email: string;
  password?: string;
  dateOfBirth?: string;
}

interface BEUserDto {
  id: string;
  email: string;
  fullName: string;
  name?: string;
  avatarUrl?: string;
  role: string;
  isActive?: boolean;
  isVip?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponseDto {
  message?: string;
  user?: BEUserDto;
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  id?: string;
  email?: string;
}
