import { create } from 'zustand';
import { useAccountStore } from './accountStore';

export type AuthModalMode = 'login' | 'register';

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
}

/** Which app-wide sheet is open. Nothing here is persisted or tied to the account. */
export const useUiStore = create<UiState>()((set) => ({
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
}));
