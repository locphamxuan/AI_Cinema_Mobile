/**
 * Standard API Response and Request Types for AI Cinema Mobile
 */

export interface ApiResponse<T = unknown> {
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

/** Body of POST /auth/google. */
export interface GoogleLoginRequestDto {
  idToken: string;
}

/** Body of POST /auth/reset-password: the 6-digit code e-mailed by POST /auth/forgot-password. */
export interface ResetPasswordRequestDto {
  email: string;
  otp: string;
  newPassword: string;
}

export interface RegisterRequestDto {
  name?: string;
  fullName?: string;
  email: string;
  password?: string;
  /** YYYY-MM-DD; the BE turns away anyone under 18. */
  dateOfBirth: string;
}

export interface BEUserDto {
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

/** GET /auth/me; the plan fields are older names the adapter still accepts. */
export interface ProfileDto extends Partial<BEUserDto> {
  isVIP?: boolean;
  vipExpiresAt?: string;
  subscription?: { endDate?: string } | null;
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
