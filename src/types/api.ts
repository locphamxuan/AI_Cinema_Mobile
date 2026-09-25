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

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth DTOs
export interface LoginRequestDto {
  email: string;
  password?: string;
}

export interface RegisterRequestDto {
  name: string;
  fullName?: string;
  email: string;
  password?: string;
  role?: string;
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
  user: BEUserDto;
  accessToken?: string;
  token?: string;
  refreshToken?: string;
}

// Movie & Catalog DTOs
export interface ApiMovieDto {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  synopsis?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  trailerUrl?: string;
  releaseYear?: number;
  rating?: number;
  matchScore?: number;
  ageRating?: string;
  duration?: string;
  quality?: string;
  category?: string;
  genre?: string[];
  cast?: string[];
  director?: string;
  views?: number;
  likes?: number;
  isVIPOnly?: boolean;
  isFree?: boolean;
  isSeries?: boolean;
  totalEpisodes?: number;
  seasons?: number;
  episodes?: ApiEpisodeDto[];
  complianceBadge?: string;
  aiContentLabel?: string;
}

export interface ApiEpisodeDto {
  id: string;
  movieId?: string;
  episodeNumber: number;
  title: string;
  description?: string;
  duration?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  tokenCost?: number;
  isVIPOnly?: boolean;
  isUnlocked?: boolean;
  releasedAt?: string;
}

// Wallet DTOs
export interface ApiWalletDto {
  mainBalance: number;
  bonusBalance: number;
  totalCoins: number;
  vipTier?: string;
}

export interface CheckInResponseDto {
  success: boolean;
  streakCount: number;
  bonusEarned: number;
  lastCheckInDate: string;
  currentDay: number;
  claimedDays: number[];
  canClaimToday: boolean;
  nextReward: number;
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

// Subscription DTOs
export interface ApiSubscriptionDto {
  planId: string;
  planName: string;
  status: 'active' | 'expired' | 'canceled' | 'none';
  startDate?: string;
  endDate?: string;
  autoRenew: boolean;
  priceVnd?: number;
}

// Production / Workflow DTOs
export interface ApiProductionProjectDto {
  id: string;
  title: string;
  description?: string;
  synopsis?: string;
  status: string;
  genre?: string[];
  seasonCount?: number;
  episodeCount?: number;
  totalAiQuotaBudget?: number;
  remainingAiQuotaBudget?: number;
  productionStartDate?: string;
  deadline?: string;
  plannedReleaseDate?: string;
  assignedCreator?: {
    id: string;
    fullName: string;
    email: string;
  };
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  };
  plans?: any[];
  episodes?: any[];
  milestones?: any[];
  createdAt?: string;
  updatedAt?: string;
}
