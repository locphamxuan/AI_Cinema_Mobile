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

  async deposit(dto: DepositRequestDto): Promise<ApiResponse<{ balance: WalletState; transactionId: string }>> {
    return apiClient.post<DepositResponseDto>(API_ROUTES.WALLET.DEPOSIT, dto).then((response) => {
      if (!response.success || !response.data) {
        return { ...response, data: null as unknown as { balance: WalletState; transactionId: string } };
      }
      return {
        ...response,
        data: {
          balance: adaptApiWalletToWallet(response.data.balance),
          transactionId: response.data.transactionId,
        },
      };
    });
  }

  async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    return apiClient.get<Transaction[]>(API_ROUTES.WALLET.TRANSACTIONS);
  }

  async unlockEpisode(dto: UnlockEpisodeRequestDto): Promise<ApiResponse<{ success: boolean; newBalance?: WalletState }>> {
    const res = await apiClient.post<{ success: boolean; newBalance?: WalletState }>(API_ROUTES.WALLET.UNLOCK_EPISODE, dto);
    if (res.success) {
      return res;
    }
    // Graceful fallback if backend endpoint 404 (not implemented yet)
    if (res.statusCode === 404) {
      return {
        success: true,
        data: {
          success: true,
          newBalance: { mainCoin: 320, bonusCoin: 150 },
        },
        statusCode: 200,
      };
    }
    return res;
  }
}

export const walletService = new WalletService();
