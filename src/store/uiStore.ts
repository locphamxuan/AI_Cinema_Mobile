import { create } from 'zustand';
import { useAccountStore } from './accountStore';
import type { Episode } from '../types/movie';
import type { HomeTabKey } from '../lib/homeFeed';

export type AuthModalMode = 'login' | 'register';

/**
 * What the member was paying for when the wallet ran short (BR-01): after the top-up is PAID the sheet offers to go
 * back to it. `gateId` names the screen's episode gate that asked, so only that screen reopens the episode; the BE
 * still decides access when it does.
 */
export type PurchaseIntent =
  | { kind: 'episode'; gateId: string; episode: Episode; label: string }
  | { kind: 'plan'; planId: string; planName: string };

interface UiState {
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  /** Prefilled in the sign-in form. */
  initialAuthEmail: string;
  openAuthModal: (mode?: AuthModalMode, email?: string) => void;
  closeAuthModal: () => void;

  isCheckInModalOpen: boolean;
  /** Opening the check-in sheet reads the ladder from the BE again. */
  setCheckInModalOpen: (open: boolean) => void;
  isRewardSpinOpen: boolean;
  setRewardSpinOpen: (open: boolean) => void;
  isTopUpModalOpen: boolean;
  setTopUpModalOpen: (open: boolean) => void;
  isChatModalOpen: boolean;
  setChatModalOpen: (open: boolean) => void;

  /** A tab Home should switch to next (a new member starts on "Phim mới": nothing to recommend yet). */
  homeTabRequest: HomeTabKey | null;
  requestHomeTab: (tab: HomeTabKey | null) => void;
  /** Hands the requested tab to Home, once. */
  takeHomeTabRequest: () => HomeTabKey | null;

  /** Set when a purchase sends the member to top up; cleared when they go back to it or give up. */
  pendingPurchase: PurchaseIntent | null;
  setPendingPurchase: (intent: PurchaseIntent | null) => void;
  /** The intent the member chose to resume after a PAID top-up, waiting for its screen to take it. */
  resumePurchase: PurchaseIntent | null;
  /** Hands the waiting intent to the screen that matches it, once. */
  takeResumePurchase: (match: (intent: PurchaseIntent) => boolean) => PurchaseIntent | null;
}

/** Which app-wide sheet is open. Nothing here is persisted or tied to the account. */
export const useUiStore = create<UiState>()((set, get) => ({
  isAuthModalOpen: false,
  authModalMode: 'login',
  initialAuthEmail: '',
  openAuthModal: (mode = 'login', email = '') => set({ isAuthModalOpen: true, authModalMode: mode, initialAuthEmail: email }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),

  isCheckInModalOpen: false,
  setCheckInModalOpen: (open) => {
    if (open) void useAccountStore.getState().loadDailyReward();
    set({ isCheckInModalOpen: open });
  },
  isRewardSpinOpen: false,
  setRewardSpinOpen: (open) => set({ isRewardSpinOpen: open }),
  isTopUpModalOpen: false,
  setTopUpModalOpen: (open) => set({ isTopUpModalOpen: open }),
  isChatModalOpen: false,
  setChatModalOpen: (open) => set({ isChatModalOpen: open }),

  homeTabRequest: null,
  requestHomeTab: (tab) => set({ homeTabRequest: tab }),
  takeHomeTabRequest: () => {
    const tab = get().homeTabRequest;
    if (tab) set({ homeTabRequest: null });
    return tab;
  },

  pendingPurchase: null,
  setPendingPurchase: (intent) => set({ pendingPurchase: intent }),
  resumePurchase: null,
  takeResumePurchase: (match) => {
    const intent = get().resumePurchase;
    if (!intent || !match(intent)) return null;
    set({ resumePurchase: null });
    return intent;
  },
}));
