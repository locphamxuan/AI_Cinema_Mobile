import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { adaptApiWalletToWallet, adaptApiCheckInToStreak } from '../lib/apiAdapter';
import type { ApiResponse, DepositRequestDto, DepositResponseDto, UnlockEpisodeRequestDto } from '../types/api';
import type { WalletState, CheckInStreak } from '../types/wallet';
import type { Transaction } from '../types/transaction';

class WalletService {
  async getWalletInfo(): Promise<ApiResponse<WalletState>> {
    return apiClient.get<WalletState>(API_ROUTES.WALLET.INFO).then((res) => {
      if (res.success && res.data) {
        return {
          ...res,
          data: adaptApiWalletToWallet(res.data),
        };
      }
      return res;
    });
  }

  async getStreak(): Promise<ApiResponse<CheckInStreak>> {
    return apiClient.get<CheckInStreak>(API_ROUTES.WALLET.STREAK).then((res) => {
      if (res.success && res.data) {
        return {
          ...res,
          data: adaptApiCheckInToStreak(res.data),
        };
      }
      return res;
    });
  }

  async checkIn(): Promise<ApiResponse<CheckInStreak & { wallet?: WalletState }>> {
    return apiClient.post<CheckInStreak & { wallet?: WalletState }>(API_ROUTES.WALLET.CHECK_IN, {}).then((res) => {
      if (res.success && res.data) {
        return {
          ...res,
          data: {
            ...adaptApiCheckInToStreak(res.data),
            wallet: (res.data as any).wallet ? adaptApiWalletToWallet((res.data as any).wallet) : undefined,
          },
        };
      }
      return res;
    });
  }

  async deposit(dto: DepositRequestDto): Promise<ApiResponse<{ balance?: WalletState; transactionId: string; paymentUrl?: string; topUpId?: string }>> {
    const response = await apiClient.post<DepositResponseDto>(API_ROUTES.WALLET.DEPOSIT, dto);
    if (!response.success || !response.data) {
      return {
        success: false,
        data: null as unknown as { balance?: WalletState; transactionId: string; paymentUrl?: string; topUpId?: string },
        message: response.message || 'TOPUP_AMOUNT_OUT_OF_RANGE hoặc lỗi tạo đơn nạp tiền trên máy chủ',
        statusCode: response.statusCode,
      };
    }
    return {
      ...response,
      data: {
        transactionId: response.data.topUpId,
        topUpId: response.data.topUpId,
        paymentUrl: response.data.redirectUrl,
      },
    };
  }

  async getTopUpStatus(topUpId: string): Promise<ApiResponse<{ id: string; status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED'; amountVnd: number; mainCoin?: number }>> {
    return apiClient.get(API_ROUTES.WALLET.TOP_UP_DETAIL(topUpId));
  }

  async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    return apiClient.get<Transaction[]>(API_ROUTES.WALLET.TRANSACTIONS);
  }

  async unlockEpisode(dto: UnlockEpisodeRequestDto): Promise<ApiResponse<{ success: boolean; newBalance?: WalletState }>> {
    const res = await apiClient.post<{ success: boolean; newBalance?: WalletState }>(API_ROUTES.WALLET.UNLOCK_EPISODE, dto);
    return res;
  }
}

export const walletService = new WalletService();
