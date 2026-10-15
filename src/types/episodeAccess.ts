/**
 * Main Flow 2 — episode access, Coin wallet, monthly plan, daily check-in and reward wheel.
 * Mirrors the BE responses of AI_Cinema_BE src/modules/episode-access; field names are the BE ones.
 */

export type AccessSourceName = 'NONE' | 'FREE_STARTER' | 'FREE' | 'PLAN' | 'EPISODE_PURCHASE' | 'ADMIN_GRANT';
export type AccessMethod = 'REGISTER_OR_LOGIN' | 'MONTHLY_PLAN' | 'UNLOCK_EPISODE' | 'OBTAIN_COIN';
export type NextAction = 'REGISTER_OR_LOGIN' | 'OBTAIN_COIN' | 'UNLOCK_EPISODE' | 'MONTHLY_PLAN' | 'HANDOFF_TO_PLAYBACK';

/** GET /episodes/:episodeId/access */
export interface AccessDecision {
  episodeId: string;
  movieId: string;
  accessGranted: boolean;
  source: AccessSourceName;
  actorType: 'GUEST' | 'MEMBER';
  planCode?: string;
  /** What the player loads; the BE only sends it once access is granted. */
  streamUrl?: string;
  accessMethods: AccessMethod[];
  required: {
    coinPrice: number;
    isFreeStarter?: boolean;
    monthlyPlanCoinPrice?: number | null;
    mainBalance?: number;
    bonusBalance?: number;
    enoughCoins?: boolean;
    missingCoins?: number;
    enoughForPlan?: boolean;
  };
  nextAction: NextAction;
}

export interface CoinSplit {
  mainCoins: number;
  bonusCoins: number;
}

/** POST /episodes/:episodeId/purchase */
export interface PurchaseResult {
  episodeId?: string;
  paidCoins: number;
  charged: CoinSplit;
  mainBalance: number;
  bonusBalance: number;
  accessGranted: boolean;
  idempotent?: boolean;
}

/** GET /wallet */
export interface WalletBalance {
  mainBalance: number;
  bonusBalance: number;
  version: number;
  expiringBonus: { lotId: string; amount: number; expiresAt: string }[];
}

export type TopUpStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
export type PaymentProvider = 'VNPAY' | 'MOMO';

/** POST /wallet/top-ups, GET /wallet/top-ups/:topUpId */
export interface CoinTopUp {
  topUpId: string;
  provider: PaymentProvider | null;
  amountVnd: number;
  coinsGranted: number;
  rateVnd: number;
  status: TopUpStatus;
  redirectUrl: string | null;
  failureReason: string | null;
  paidAt: string | null;
  expiresAt: string | null;
}

/** Paginated endpoint result returned by Nest's pagination wrapper. */
export interface Page<T> {
  data: T[];
  meta: { totalItems?: number; currentPage: number; totalPages?: number; itemsPerPage: number };
}

/** GET /wallet/top-ups/options */
export interface TopUpOptions {
  rateVnd: number;
  minVnd: number;
  maxVnd: number;
}

export type CoinEntryType =
  | 'TOP_UP'
  | 'SIGNUP_BONUS'
  | 'DAILY_REWARD'
  | 'EPISODE_PURCHASE'
  | 'REWARD_SPIN'
  | 'PLAN_PAYMENT'
  | 'PLAN_RENEWAL'
  | 'REFUND'
  | 'BONUS_EXPIRY'
  | 'ADJUSTMENT';

/** GET /wallet/statements — one ledger line with the balances right after it. */
export interface StatementLine {
  id: string;
  entryType: CoinEntryType;
  mainAmount: number;
  bonusAmount: number;
  description: string | null;
  createdAt: string;
  mainBalanceAfter: number;
  bonusBalanceAfter: number;
  rateVnd?: number;
  referenceType?: string | null;
  referenceId?: string | null;
}

export interface SubscriptionCycleView {
  id: string;
  cycleNumber: number;
  status: 'PAID' | 'FAILED' | 'SKIPPED';
  priceCoins: number;
  periodStart: string;
  periodEnd: string;
  mainCoinsCharged: number;
  bonusCoinsCharged: number;
  failureReason: string | null;
  attemptedAt: string;
  createdAt: string;
}

/** GET /membership-plans */
export interface MembershipPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  period: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  durationDays: number;
  isFree: boolean;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  priceCoins: number | null;
}

/** POST /subscriptions — a quote; no Coin has moved yet. */
export interface SubscriptionIntent {
  id: string;
  status: string;
  priceCoins: number;
  enoughCoins: boolean;
  missingCoins: number;
}

/** POST /subscriptions/:id/activate — the first cycle is paid. */
export interface SubscriptionActivation {
  id: string;
  status: string;
  priceCoins: number;
  charged: CoinSplit;
  mainBalance: number;
  bonusBalance: number;
  currentPeriodEnd: string;
  nextRenewalAt: string | null;
}

/** GET /subscriptions/me — the open plan (PENDING = quoted, not paid), or null. */
export interface MySubscription {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'PAST_DUE';
  autoRenew: boolean;
  priceCoins: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextRenewalAt: string | null;
  cancelDeadline: string | null;
  plan: { id: string; code: string; name: string; durationDays: number };
}

/** POST /subscriptions/:id/cancel-auto-renew | resume-auto-renew */
export interface AutoRenewState {
  id: string;
  autoRenew: boolean;
  nextRenewalAt: string | null;
}

export interface RewardLadderStep {
  streakDay: number;
  bonusCoins: number;
  grantsSpin: boolean;
}

/** GET /daily-rewards/status */
export interface DailyRewardStatus {
  checkInDate: string;
  checkedInToday: boolean;
  streakDay: number;
  streakContinued: boolean;
  reward: { bonusCoins: number; grantsSpin: boolean };
  ladder: RewardLadderStep[];
  availableSpins: number;
  mainBalance: number;
  bonusBalance: number;
  expiringBonus: { lotId: string; amount: number; expiresAt: string }[];
}

/** POST /daily-rewards/check-in */
export interface CheckInResult {
  checkInDate: string;
  streakDay: number;
  streakContinued: boolean;
  bonusGranted: number;
  spinGranted: boolean;
  mainBalance: number;
  bonusBalance: number;
}

export type RewardPrizeType = 'BONUS_COIN' | 'PLAN_DAYS';

export interface RewardPrize {
  id: string;
  code: string;
  name: string;
  type: RewardPrizeType;
  bonusCoins: number | null;
  planDays: number | null;
  chancePercent?: number;
}

export interface RewardSpinHistoryItem {
  id: string;
  status: 'AVAILABLE' | 'USED';
  grantedAt: string;
  spunAt: string | null;
  prize: RewardPrize | null;
  bonusCoins: number | null;
  planDays: number | null;
}

/** GET /rewards/spins */
export interface RewardWheelStatus {
  availableSpins: number;
  prizes: RewardPrize[];
  history: RewardSpinHistoryItem[];
}

/** POST /rewards/spins */
export interface SpinResult extends RewardSpinHistoryItem {
  prize: RewardPrize;
  planActiveUntil: string | null;
  mainBalance: number;
  bonusBalance: number;
  availableSpins: number;
}
