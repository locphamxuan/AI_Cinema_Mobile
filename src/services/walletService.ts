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
  Page,
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

  /** GET /wallet/affordability — split an intended spend between main and bonus Coins. */
  getAffordability(amountCoins: number): Promise<ApiResponse<{
    requiredCoins: number;
    mainBalance: number;
    bonusBalance: number;
    enoughCoins: boolean;
    missingCoins: number;
    plannedSplit: { mainCoins: number; bonusCoins: number };
  }>> {
    return apiClient.get(API_ROUTES.WALLET.AFFORDABILITY, { params: { amountCoins } });
  }

  /** POST /wallet/top-ups — opens a gateway order; `redirectUrl` is the payment page. */
  createTopUp(provider: PaymentProvider, amountVnd: number): Promise<ApiResponse<CoinTopUp>> {
    return apiClient.post<CoinTopUp>(API_ROUTES.WALLET.TOP_UPS, { provider, amountVnd });
  }

  /** GET /wallet/top-ups — this member's paginated order history. */
  getTopUps(page = 1): Promise<ApiResponse<Page<CoinTopUp>>> {
    return apiClient.get<Page<CoinTopUp>>(API_ROUTES.WALLET.TOP_UPS, { params: { page, limit: STATEMENT_PAGE_SIZE } });
  }

  /** GET /wallet/top-ups/:topUpId — the IPN settles the order in the background. */
  getTopUp(topUpId: string): Promise<ApiResponse<CoinTopUp>> {
    return apiClient.get<CoinTopUp>(API_ROUTES.WALLET.TOP_UP_DETAIL(topUpId));
  }

  /** GET /wallet/statements — the member's Coin ledger, newest first. */
  async getStatements(page = 1, entryType?: CoinEntryType): Promise<ApiResponse<StatementLine[]>> {
    const res = await apiClient.get<Page<StatementLine> | StatementLine[]>(API_ROUTES.WALLET.STATEMENTS, {
      params: { page, limit: STATEMENT_PAGE_SIZE, entryType },
    });
    if (!res.success || !res.data) return { ...res, data: null as unknown as StatementLine[] };
    // The BE returns { data, meta }; keep the existing UI contract as a list of rows.
    const rows = Array.isArray(res.data) ? res.data : res.data.data;
    return { ...res, data: rows };
  }

  /** GET /wallet/transactions/:id — one ledger row, scoped to the signed-in member. */
  getTransaction(id: string): Promise<ApiResponse<StatementLine & { walletId: string; reversesId: string | null; lotId: string | null }>> {
    return apiClient.get(API_ROUTES.WALLET.TRANSACTION_DETAIL(id));
  }
}

export const walletService = new WalletService();
