/**
 * Standard API Response and Request Types for AI Cinema Mobile
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  statusCode?: number;
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

export interface AuthResponseDto {
  message?: string;
  user?: BEUserDto;
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  id?: string;
  email?: string;
}

// Wallet DTOs
export interface ApiWalletDto {
  mainBalance: number;
  bonusBalance: number;
  totalCoins: number;
  vipTier?: string;
}

export interface DepositRequestDto {
  amountVnd: number;
  paymentMethod: string;
  packageId?: string;
  mainCoin?: number;
  bonusCoin?: number;
}

export interface DepositResponseDto {
  transactionId: string;
  mainCoin: number;
  bonusCoin: number;
  status: string;
  balance: ApiWalletDto;
}

export interface UnlockEpisodeRequestDto {
  episodeId: string;
  movieId?: string;
}
