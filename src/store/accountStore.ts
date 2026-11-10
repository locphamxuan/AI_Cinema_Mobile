import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { episodeAccessService, rewardService, walletService } from '../services';
import type { WalletState } from '../types/wallet';
import type { CheckInResult, DailyRewardStatus, MySubscription } from '../types/episodeAccess';

const emptyWallet: WalletState = { mainCoin: 0, bonusCoin: 0 };

/** A plan opens every episode only while ACTIVE and inside the period already paid for. */
export const planIsRunning = (plan: MySubscription | null, now = Date.now()) =>
  plan !== null && plan.status === 'ACTIVE' && new Date(plan.currentPeriodEnd).getTime() > now;

/** What a signed-out device holds: nothing of anyone's account. */
export const signedOutAccount = () => ({
  isVIPMode: false,
  wallet: emptyWallet,
  subscription: null as MySubscription | null,
  dailyReward: null as DailyRewardStatus | null,
});

interface AccountState {
  /** Coin chính / Coin thưởng (BR-01), always the BE's numbers. */
  wallet: WalletState;
  setWalletBalance: (main: number, bonus: number) => void;
  /** GET /subscriptions/me, as the BE last answered. */
  subscription: MySubscription | null;
  /** The monthly plan is running. A display hint only: every episode is still opened through the BE. */
  isVIPMode: boolean;
  /** Reads the wallet and the plan from the BE. */
  loadAccountData: () => Promise<void>;

  // Daily check-in (BR-05) and the reward spins it can grant (BR-09)
  dailyReward: DailyRewardStatus | null;
  loadDailyReward: () => Promise<boolean>;
  claimDailyCheckIn: () => Promise<{ success: boolean; result?: CheckInResult; error?: string }>;

  /** Forgets everything of the account, on sign-in, sign-out or an expired session. */
  reset: () => void;
}

/** The member's Coin wallet, monthly plan and daily reward, all read from the BE. */
export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      ...signedOutAccount(),

      setWalletBalance: (main, bonus) => set((s) => ({ wallet: { ...s.wallet, mainCoin: main, bonusCoin: bonus } })),

      loadAccountData: async () => {
        const [walletRes, planRes] = await Promise.all([walletService.getWalletInfo(), episodeAccessService.getMySubscription()]);
        const wallet = walletRes.success ? { wallet: walletRes.data } : {};
        if (!planRes.success) {
          set(wallet);
          return;
        }
        set({ ...wallet, subscription: planRes.data, isVIPMode: planIsRunning(planRes.data) });
      },

      loadDailyReward: async () => {
        const res = await rewardService.getDailyStatus();
        if (res.success && res.data) {
          set({ dailyReward: res.data, wallet: { mainCoin: res.data.mainBalance, bonusCoin: res.data.bonusBalance } });
          return true;
        }
        return false;
      },

      claimDailyCheckIn: async () => {
        const res = await rewardService.checkIn();
        if (!res.success || !res.data) return { success: false, error: res.message || 'Không điểm danh được.' };
        set({ wallet: { mainCoin: res.data.mainBalance, bonusCoin: res.data.bonusBalance } });
        await get().loadDailyReward();
        return { success: true, result: res.data };
      },

      reset: () => set(signedOutAccount()),
    }),
    {
      name: 'ai_cinema_mobile_account_store',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Only the plan flag survives a restart, so episode rows do not flash locked before the BE answers.
      partialize: (state) => ({ isVIPMode: state.isVIPMode }),
    },
  ),
);
