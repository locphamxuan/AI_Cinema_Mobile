import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import type { ApiResponse } from '../types/api';
import type { WalletState } from '../types/wallet';
import type {
  CoinEntryType,
  CoinTopUp,
  PaymentProvider,
  StatementLine,
  TopUpOptions,
  WalletBalance,
} from '../types/episodeAccess';

export const STATEMENT_PAGE_SIZE = 20;

class WalletService {
  /** GET /wallet — main Coins (top-ups) and bonus Coins (rewards). */
  async getWalletInfo(): Promise<ApiResponse<WalletState>> {
    const res = await apiClient.get<WalletBalance>(API_ROUTES.WALLET.INFO);
    if (!res.success || !res.data) return { ...res, data: null as unknown as WalletState };
    return { ...res, data: { mainCoin: res.data.mainBalance, bonusCoin: res.data.bonusBalance } };
  }

  /** GET /wallet/top-ups/options — the Admin's VND-per-Coin rate and accepted range. */
  getTopUpOptions(): Promise<ApiResponse<TopUpOptions>> {
    return apiClient.get<TopUpOptions>(API_ROUTES.WALLET.TOP_UP_OPTIONS);
  }

  /** POST /wallet/top-ups — opens a gateway order; `redirectUrl` is the payment page. */
  createTopUp(provider: PaymentProvider, amountVnd: number): Promise<ApiResponse<CoinTopUp>> {
    return apiClient.post<CoinTopUp>(API_ROUTES.WALLET.TOP_UPS, { provider, amountVnd });
  }

  /** GET /wallet/top-ups/:topUpId — the IPN settles the order in the background. */
  getTopUp(topUpId: string): Promise<ApiResponse<CoinTopUp>> {
    return apiClient.get<CoinTopUp>(API_ROUTES.WALLET.TOP_UP_DETAIL(topUpId));
  }

  /** GET /wallet/statements — the member's Coin ledger, newest first. */
  getStatements(page = 1, entryType?: CoinEntryType): Promise<ApiResponse<StatementLine[]>> {
    return apiClient.get<StatementLine[]>(API_ROUTES.WALLET.STATEMENTS, {
      params: { page, limit: STATEMENT_PAGE_SIZE, entryType },
    });
  }
}

export const walletService = new WalletService();
