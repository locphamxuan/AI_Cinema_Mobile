import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { WalletState } from '../types/wallet';
import { Movie, WatchHistoryItem } from '../types/movie';
import type { CheckInResult, DailyRewardStatus, MySubscription } from '../types/episodeAccess';
import { ChatMessage, ChatPhase, SupportTicket } from '../types/chat';
import { UserProfile } from '../types/auth';
import {
  authService,
  movieService,
  walletService,
  episodeAccessService,
  rewardService,
  chatService,
} from '../services';
import { apiClient } from '../services/apiClient';
import { adaptUserProfile } from '../lib/apiAdapter';

const emptyWallet: WalletState = { mainCoin: 0, bonusCoin: 0 };

/** A plan opens every episode only while ACTIVE and inside the period already paid for. */
export const planIsRunning = (plan: MySubscription | null, now = Date.now()) =>
  plan !== null && plan.status === 'ACTIVE' && new Date(plan.currentPeriodEnd).getTime() > now;

/** Everything tied to the signed-in account, reset on logout or when the session expires. */
const signedOutState = () => ({
  isAuthenticated: false,
  user: null,
  isVIPMode: false,
  wallet: emptyWallet,
  subscription: null as MySubscription | null,
  dailyReward: null as DailyRewardStatus | null,
});

interface AppState {
  // Movies Data & Loading
  movies: Movie[];
  isLoadingMovies: boolean;
  loadInitialData: () => Promise<void>;
  loadAccountData: () => Promise<void>;
  fetchMovies: (params?: { search?: string; genre?: string }) => Promise<void>;

  // Auth
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string; role?: string }>;
  register: (name: string, email: string, password: string, dateOfBirth?: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string; role?: string }>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  initialAuthEmail: string;
  openAuthModal: (mode?: 'login' | 'register', email?: string) => void;
  closeAuthModal: () => void;

  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  /** The monthly plan is running (GET /subscriptions/me): every released episode is open. */
  isVIPMode: boolean;

  // Wallet — balances always come from the BE
  wallet: WalletState;
  setWalletBalance: (main: number, bonus: number) => void;

  // Daily check-in (BR-05) and reward spins (BR-09)
  dailyReward: DailyRewardStatus | null;
  loadDailyReward: () => Promise<boolean>;
  claimDailyCheckIn: () => Promise<{ success: boolean; result?: CheckInResult; error?: string }>;
  isRewardSpinOpen: boolean;
  setRewardSpinOpen: (open: boolean) => void;

  // Movie
  currentMovie: Movie | null;
  setCurrentMovie: (movie: Movie | null) => void;
  /** Flags an episode the BE granted (bought, plan, free starter); the wallet is left alone. */
  markEpisodeUnlocked: (episodeId: string) => void;

  // Monthly plan
  subscription: MySubscription | null;

  // Chat
  chatMessages: ChatMessage[];
  chatPhase: ChatPhase;
  chatIsOpen: boolean;
  chatTicket: SupportTicket | null;
  estimatedWaitMinutes: number;
  toggleChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  handleQuickAction: (actionId: string) => void;
  escalateToAgent: () => Promise<void>;

  // Modals
  isCheckInModalOpen: boolean;
  setCheckInModalOpen: (open: boolean) => void;
  isUnlockModalOpen: boolean;
  selectedEpisodeId: string | null;
  openUnlockModal: (episodeId: string) => void;
  closeUnlockModal: () => void;
  isTopUpModalOpen: boolean;
  setTopUpModalOpen: (open: boolean) => void;

  // My List
  myList: string[];
  toggleMyList: (movieId: string) => void;

  // Watch History
  watchHistory: WatchHistoryItem[];
  addToWatchHistory: (item: Omit<WatchHistoryItem, 'id' | 'lastWatchedAt'>) => void;

}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ===== MOVIES & DATA LOADING =====
      movies: [],
      isLoadingMovies: false,

      loadInitialData: async () => {
        try {
          set({ isLoadingMovies: true });

          const moviesRes = await movieService.listMovies({ limit: 50 });

          const rawList = moviesRes.success && Array.isArray(moviesRes.data)
            ? moviesRes.data
            : [];
          set({ movies: rawList, currentMovie: rawList[0] || null, isLoadingMovies: false });
          if (get().isAuthenticated) {
            // The persisted "signed in" flag can outlive the session; confirm it with the backend.
            const profileRes = await authService.getProfile();
            if (profileRes.success) {
              set((s) => ({ user: s.user ? { ...s.user, ...profileRes.data } : profileRes.data }));
              await get().loadAccountData();
            } else if (profileRes.statusCode === 401) {
              await apiClient.clearSession();
              set(signedOutState());
            }
          }
        } catch {
          set({ isLoadingMovies: false });
        }
      },

      loadAccountData: async () => {
        const [walletRes, planRes] = await Promise.all([
          walletService.getWalletInfo(),
          episodeAccessService.getMySubscription(),
        ]);
        set((state) => {
          if (!planRes.success) return walletRes.success ? { wallet: walletRes.data } : {};
          const running = planIsRunning(planRes.data);
          return {
            ...(walletRes.success ? { wallet: walletRes.data } : {}),
            subscription: planRes.data,
            isVIPMode: running,
            user: state.user ? { ...state.user, isVIP: running } : null,
          };
        });
      },

      fetchMovies: async (params) => {
        try {
          set({ isLoadingMovies: true });
          const res = await movieService.listMovies(params);
          if (res.success && res.data) {
            const rawList = Array.isArray(res.data)
              ? res.data
              : (res.data as any).items || (res.data as any).data || [];
            if (Array.isArray(rawList) && rawList.length > 0) {
              set({ movies: rawList, isLoadingMovies: false });
              return;
            }
          }
          set({ movies: [], isLoadingMovies: false });
        } catch {
          set({ movies: [], isLoadingMovies: false });
        }
      },

      // ===== AUTH & USER =====
      isAuthenticated: false,
      user: null,
      isAuthModalOpen: false,
      authModalMode: 'login',
      initialAuthEmail: '',

      openAuthModal: (mode = 'login', email = '') =>
        set({ isAuthModalOpen: true, authModalMode: mode, initialAuthEmail: email }),

      closeAuthModal: () => set({ isAuthModalOpen: false }),

      login: async (email, password) => {
        const trimmedEmail = email.trim().toLowerCase();

        try {
          const res = await authService.login({ email: trimmedEmail, password });
          if (res.success && res.data?.user) {
            const profile = adaptUserProfile(res.data.user);
            // Whether the member has a plan is the BE's answer (loadAccountData), not the profile's.
            set({
              ...signedOutState(),
              isAuthenticated: true,
              user: { ...profile, role: 'user', isVIP: false },
              isAuthModalOpen: false,
            });
            await get().loadAccountData();

            return { success: true, redirectUrl: '/', role: 'user' };
          }

          return {
            success: false,
            error: res.message || 'Email hoặc mật khẩu chưa đúng.',
          };
        } catch (e: any) {
          return {
            success: false,
            error: e?.message || 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',
          };
        }
      },

      register: async (name, email, password, dateOfBirth) => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();
        const trimmedDob = (dateOfBirth || '').trim();

        if (!trimmedEmail || !password || !trimmedName || !trimmedDob) {
          return { success: false, error: 'Điền đủ họ tên, ngày sinh, email và mật khẩu.' };
        }

        if (password.length < 8) {
          return { success: false, error: 'Mật khẩu cần 8 đến 72 ký tự, có cả chữ và số.' };
        }

        try {
          const res = await authService.register({
            fullName: trimmedName,
            email: trimmedEmail,
            password,
            dateOfBirth: trimmedDob,
          });

          if (res.success) {
            return { success: true, email: trimmedEmail };
          }

          return {
            success: false,
            error: res.message || 'Chưa tạo được tài khoản. Thử lại sau ít phút.',
          };
        } catch (e: any) {
          return {
            success: false,
            error: e?.message || 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',
          };
        }
      },

      logout: async () => {
        await authService.logout();
        set(signedOutState());
      },

      // ===== THEME (Default Pure White Light Mode) =====
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: nextTheme });
      },

      // ===== MONTHLY PLAN & WALLET =====
      isVIPMode: false,
      subscription: null,
      wallet: emptyWallet,

      setWalletBalance: (main, bonus) =>
        set((s) => ({ wallet: { ...s.wallet, mainCoin: main, bonusCoin: bonus } })),

      // ===== DAILY CHECK-IN & REWARD SPINS =====
      dailyReward: null,

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

      isRewardSpinOpen: false,
      setRewardSpinOpen: (open) => set({ isRewardSpinOpen: open }),

      // ===== MOVIE =====
      currentMovie: null,
      setCurrentMovie: (movie) => set({ currentMovie: movie }),

      markEpisodeUnlocked: (episodeId) =>
        set((s) => ({
          currentMovie: s.currentMovie && {
            ...s.currentMovie,
            episodes: s.currentMovie.episodes.map((ep) => (ep.id === episodeId ? { ...ep, isUnlocked: true } : ep)),
          },
        })),

      // ===== CHAT =====
      chatMessages: [],
      chatPhase: 'bot' as ChatPhase,
      chatIsOpen: false,
      chatTicket: null,
      estimatedWaitMinutes: 5,

      toggleChat: () => set((s) => ({ chatIsOpen: !s.chatIsOpen })),

      sendMessage: async (content: string) => {
        const userMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: 'user',
          content,
          timestamp: new Date().toISOString(),
        };

        set((s) => ({ chatMessages: [...s.chatMessages, userMsg] }));

        const response = await chatService.sendMessage(content);
        if (response.success && response.data) {
            const botMsg: ChatMessage = {
              ...response.data,
            };
            set((s) => ({ chatMessages: [...s.chatMessages, botMsg] }));
        } else {
            const botMsg: ChatMessage = {
              id: `msg-${Date.now()}`,
              sender: 'system',
              content: response.message || 'Tin nhắn chưa gửi được. Kiểm tra mạng rồi gửi lại.',
              timestamp: new Date().toISOString(),
            };
            set((s) => ({ chatMessages: [...s.chatMessages, botMsg] }));
        }
      },

      handleQuickAction: (actionId: string) => {
        const actionLabels: Record<string, string> = {
          'coin-error': 'Tôi gặp lỗi trừ Coin',
          'cancel-renew': 'Tôi muốn hủy gia hạn tự động',
          'report': 'Tôi muốn báo cáo vi phạm',
        };

        const userMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: 'user',
          content: actionLabels[actionId] || actionId,
          timestamp: new Date().toISOString(),
        };

        void get().sendMessage(userMsg.content);
      },

      escalateToAgent: async () => {
        const state = get();
        const response = await chatService.createTicket(state.chatMessages);
        if (response.success && response.data) {
          const ticket: SupportTicket = response.data;
          set((current) => ({
            chatPhase: 'waiting',
            chatTicket: ticket,
            chatMessages: [...current.chatMessages, {
              id: `msg-${Date.now()}`,
              sender: 'system',
              content: `Đã tạo phiếu hỗ trợ #${ticket.id}.`,
              timestamp: new Date().toISOString(),
            }],
          }));
        }
      },

      // ===== MODALS =====
      isCheckInModalOpen: false,
      setCheckInModalOpen: (open) => {
        if (open) void get().loadDailyReward();
        set({ isCheckInModalOpen: open });
      },

      isUnlockModalOpen: false,
      selectedEpisodeId: null,
      openUnlockModal: (episodeId) => set({ isUnlockModalOpen: true, selectedEpisodeId: episodeId }),
      closeUnlockModal: () => set({ isUnlockModalOpen: false, selectedEpisodeId: null }),

      isTopUpModalOpen: false,
      setTopUpModalOpen: (open) => set({ isTopUpModalOpen: open }),

      // ===== MY LIST =====
      myList: [],
      toggleMyList: (movieId) =>
        set((s) => ({
          myList: s.myList.includes(movieId)
            ? s.myList.filter((id) => id !== movieId)
            : [...s.myList, movieId],
        })),

      // ===== WATCH HISTORY =====
      watchHistory: [],
      addToWatchHistory: (item) =>
        set((s) => {
          const existing = s.watchHistory.filter((h) => h.movieId !== item.movieId);
          const newItem: WatchHistoryItem = {
            ...item,
            id: `wh-${Date.now()}`,
            lastWatchedAt: 'Vừa xong',
          };
          return { watchHistory: [newItem, ...existing] };
        }),

    }),
    {
      name: 'ai_cinema_mobile_app_store',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: async (persistedState: any) => {
        await Promise.all([
          storage.remove(STORAGE_KEYS.AUTH_TOKEN),
          storage.remove(STORAGE_KEYS.USER_DATA),
          storage.remove(STORAGE_KEYS.WALLET_DATA),
        ]);
        return {
          ...persistedState,
          isAuthenticated: false,
          user: null,
          isVIPMode: false,
          wallet: emptyWallet,
          subscription: null,
          dailyReward: null,
          myList: [],
          watchHistory: [],
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state && typeof state.loadInitialData === 'function') void state.loadInitialData();
      },
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        isVIPMode: state.isVIPMode,
        myList: state.myList,
        watchHistory: state.watchHistory,
        theme: state.theme,
      }),
    }
  )
);

// A refresh token the backend rejects means the session is over on every screen.
apiClient.onSessionExpired(() => useAppStore.setState(signedOutState()));
