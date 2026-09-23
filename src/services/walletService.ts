import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { mockWallet, mockCheckInStreak, mockTransactions } from '../mocks/mockData';
import { adaptApiWalletToWallet, adaptApiCheckInToStreak } from '../lib/apiAdapter';
import type { ApiResponse, DepositRequestDto, UnlockEpisodeRequestDto } from '../types/api';
import type { WalletState, CheckInStreak } from '../types/wallet';
import type { Transaction } from '../types/transaction';

class WalletService {
  async getWalletInfo(): Promise<ApiResponse<WalletState>> {
    return apiClient.get<WalletState>(
      API_ROUTES.WALLET.INFO,
      undefined,
      async () => mockWallet
    ).then((res) => {
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
    return apiClient.get<CheckInStreak>(
      API_ROUTES.WALLET.STREAK,
      undefined,
      async () => mockCheckInStreak
    ).then((res) => {
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
    return apiClient.post<CheckInStreak & { wallet?: WalletState }>(
      API_ROUTES.WALLET.CHECK_IN,
      {},
      undefined,
      async () => ({
        ...mockCheckInStreak,
        currentStreak: mockCheckInStreak.currentStreak + 1,
        todayClaimed: true,
        wallet: {
          mainCoin: mockWallet.mainCoin,
          bonusCoin: mockWallet.bonusCoin + 20,
        },
      })
    ).then((res) => {
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

  async deposit(dto: DepositRequestDto): Promise<ApiResponse<{ balance: WalletState; transaction: Transaction }>> {
    return apiClient.post<{ balance: WalletState; transaction: Transaction }>(
      API_ROUTES.WALLET.DEPOSIT,
      dto,
      undefined,
      async () => {
        const addedCoins = dto.mainCoin ?? Math.round(dto.amountVnd / 1000);
        const bonusCoins = dto.bonusCoin ?? Math.round(addedCoins * 0.1);
        const newBalance: WalletState = {
          mainCoin: mockWallet.mainCoin + addedCoins,
          bonusCoin: mockWallet.bonusCoin + bonusCoins,
        };
        const newTx: Transaction = {
          id: `tx-${Date.now()}`,
          type: 'deposit',
          typeLabel: 'Nạp Coin',
          description: `Nạp ${dto.amountVnd.toLocaleString('vi-VN')} VND qua ${dto.paymentMethod}`,
          mainCoinDelta: addedCoins,
          bonusCoinDelta: bonusCoins,
          totalAmount: addedCoins + bonusCoins,
          status: 'success',
          statusLabel: 'Thành công',
          createdAt: new Date().toISOString(),
        };
        return { balance: newBalance, transaction: newTx };
      }
    );
  }

  async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    return apiClient.get<Transaction[]>(
      API_ROUTES.WALLET.TRANSACTIONS,
      undefined,
      async () => mockTransactions
    );
  }

  async unlockEpisode(dto: UnlockEpisodeRequestDto): Promise<ApiResponse<{ success: boolean; newBalance?: WalletState }>> {
    return apiClient.post<{ success: boolean; newBalance?: WalletState }>(
      API_ROUTES.WALLET.UNLOCK_EPISODE,
      dto,
      undefined,
      async () => ({
        success: true,
        newBalance: {
          mainCoin: Math.max(0, mockWallet.mainCoin - 50),
          bonusCoin: mockWallet.bonusCoin,
        },
      })
    );
  }
}

export const walletService = new WalletService();
