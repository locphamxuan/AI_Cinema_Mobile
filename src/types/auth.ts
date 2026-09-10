export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'user' | 'vip' | 'admin';
  isVIP: boolean;
  vipExpiresAt?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}
