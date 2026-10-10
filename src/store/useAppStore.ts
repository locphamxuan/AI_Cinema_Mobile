import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { WalletState, CheckInStreak } from '../types/wallet';
import { Movie, WatchHistoryItem } from '../types/movie';
import { UserSubscription } from '../types/subscription';
import { Transaction } from '../types/transaction';
import { ChatMessage, ChatPhase, SupportTicket } from '../types/chat';
import { UserProfile } from '../types/auth';
import { VN_DAY_LABELS } from '../utils/date';
import {
  authService,
  movieService,
  walletService,
  subscriptionService,
  chatService,
} from '../services';
import { apiClient } from '../services/apiClient';
import {
  adaptApiMovieToMovie,
  adaptApiWalletToWallet,
  adaptApiCheckInToStreak,
  adaptUserProfile,
} from '../lib/apiAdapter';
import { getTodayDayIndex } from '../utils/date';

export const emptySubscription: UserSubscription = {
  plan: null,
  status: 'none',
  startDate: null,
  endDate: null,
  autoRenew: false,
  paymentMethod: '',
};

const emptyWallet: WalletState = { mainCoin: 0, bonusCoin: 0 };

const createEmptyCheckInStreak = (): CheckInStreak => ({
  days: VN_DAY_LABELS.map((dayLabel, dayIndex) => ({
    dayIndex,
    dayLabel,
    reward: 0,
    claimed: false,
    isToday: dayIndex === getTodayDayIndex(),
  })),
  currentStreak: 0,
  lastCheckInDate: null,
  todayClaimed: false,
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

  // VIP Mode
  isVIPMode: boolean;

  // Wallet
  wallet: WalletState;
  checkInStreak: CheckInStreak;
  claimDailyCheckIn: () => Promise<boolean>;
  syncCheckInStreak: () => Promise<void>;
  setWalletBalance: (main: number, bonus: number) => void;

  // Movie
  currentMovie: Movie | null;
    setCurrentMovie: (movie: Movie | null) => void;
  unlockEpisode: (episodeId: string) => Promise<{ success: boolean; error?: string }>;

  // Subscription
  subscription: UserSubscription;
  toggleAutoRenew: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  subscribeToPlan: (planId: string) => Promise<{ success: boolean; error?: string }>;

  // Transactions
  transactions: Transaction[];

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

  // Deposit
  depositCoins: (amountVnd: number, paymentMethod: string) => Promise<boolean>;
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
          if (get().isAuthenticated) await get().loadAccountData();
        } catch (e) {
          set({ isLoadingMovies: false });
        }
      },

      loadAccountData: async () => {
        const [walletRes, streakRes, transactionsRes, subscriptionRes] = await Promise.all([
          walletService.getWalletInfo(),
          walletService.getStreak(),
          walletService.getTransactions(),
          subscriptionService.getCurrentSubscription(),
        ]);
        set((state) => ({
          ...(walletRes.success && walletRes.data ? { wallet: walletRes.data } : {}),
          ...(streakRes.success && streakRes.data ? { checkInStreak: streakRes.data } : {}),
          ...(transactionsRes.success && Array.isArray(transactionsRes.data)
            ? { transactions: transactionsRes.data }
            : {}),
          ...(subscriptionRes.success && subscriptionRes.data
            ? {
                subscription: subscriptionRes.data,
                isVIPMode: subscriptionRes.data.status === 'active' || state.user?.isVIP === true,
              }
            : {}),
        }));
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
        } catch (e) {
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

        // 1. Chặn tài khoản Maker / Checker trên Mobile - chỉ hỗ trợ trên Web Studio
        if (trimmedEmail === 'creator@gmail.com' || trimmedEmail === 'reviewer@gmail.com') {
          return {
            success: false,
            error: 'Tài khoản Sản xuất & Kiểm duyệt (Maker/Checker) chỉ hỗ trợ trên phiên bản Web Studio máy tính. Ứng dụng di động chỉ dành riêng cho Khán giả!',
          };
        }

        try {
          const res = await authService.login({ email: trimmedEmail, password });
          if (res.success && res.data?.user) {
            const profile = adaptUserProfile(res.data.user);
            const isVip = profile.role === 'vip' || profile.isVIP;

            set({
              isAuthenticated: true,
              user: {
                ...profile,
                role: isVip ? 'vip' : 'user',
                isVIP: isVip,
              },
              isVIPMode: isVip,
              isAuthModalOpen: false,
              subscription: emptySubscription,
            });
            await get().loadAccountData();

            return {
              success: true,
              redirectUrl: '/',
              role: isVip ? 'vip' : 'user',
            };
          }

          return {
            success: false,
            error: res.message || 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!',
          };
        } catch (e: any) {
          return {
            success: false,
            error: e?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau!',
          };
        }
      },

      register: async (name, email, password, dateOfBirth) => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();
        const trimmedDob = (dateOfBirth || '2003-05-14').trim();

        if (!trimmedEmail || !password || !trimmedName || !trimmedDob) {
          return { success: false, error: 'Vui lòng điền đầy đủ thông tin đăng ký!' };
        }

        if (password.length < 8) {
          return { success: false, error: 'Mật khẩu phải từ 8 đến 72 ký tự (có ít nhất 1 chữ cái và 1 chữ số)!' };
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
            error: res.message || 'Đăng ký không thành công. Vui lòng thử lại!',
          };
        } catch (e: any) {
          return {
            success: false,
            error: e?.message || 'Lỗi kết nối máy chủ khi đăng ký',
          };
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (e) {
          console.warn('Logout error:', e);
        }
        set({
          isAuthenticated: false,
          user: null,
          isVIPMode: false,
          subscription: emptySubscription,
        });
      },

      // ===== THEME (Default Pure White Light Mode) =====
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: nextTheme });
      },

      // ===== VIP MODE =====
      isVIPMode: false,
      // ===== WALLET & CHECK-IN (PERSISTENT) =====
      wallet: emptyWallet,
      checkInStreak: createEmptyCheckInStreak(),

      syncCheckInStreak: async () => {
        const response = await walletService.getStreak();
        if (response.success && response.data) set({ checkInStreak: response.data });
      },

      claimDailyCheckIn: async () => {
        const response = await walletService.checkIn();
        if (!response.success || !response.data) return false;
        set({ checkInStreak: response.data });
        if (response.data.wallet) set({ wallet: response.data.wallet });
        else {
          const walletRes = await walletService.getWalletInfo();
          if (walletRes.success && walletRes.data) set({ wallet: walletRes.data });
        }
        const transactionsRes = await walletService.getTransactions();
        if (transactionsRes.success && Array.isArray(transactionsRes.data)) {
          set({ transactions: transactionsRes.data });
        }
        return true;
      },

      setWalletBalance: (main, bonus) =>
        set((s) => ({ wallet: { ...s.wallet, mainCoin: main, bonusCoin: bonus } })),

      // ===== MOVIE =====
      currentMovie: null,
      setCurrentMovie: (movie) => set({ currentMovie: movie }),

      unlockEpisode: async (episodeId: string) => {
        const state = get();
        const currentMovie = state.currentMovie;
        if (!currentMovie) return { success: false, error: 'Không có phim đang được chọn' };
        const episode = currentMovie.episodes.find((ep) => ep.id === episodeId);
        if (!episode) return { success: false, error: 'Tập phim không tồn tại' };
        if (episode.isUnlocked || episode.isFree) return { success: true };

        const response = await walletService.unlockEpisode({ movieId: currentMovie.id, episodeId });
        if (!response.success || response.data?.success === false) {
          return { success: false, error: response.message || 'Không thể mở khóa tập phim' };
        }

        set((s) => ({
          ...(response.data?.newBalance ? { wallet: response.data.newBalance } : {}),
          currentMovie: {
            ...currentMovie,
            episodes: currentMovie.episodes.map((ep) =>
              ep.id === episodeId ? { ...ep, isUnlocked: true } : ep
            ),
          },
        }));
        if (!response.data?.newBalance) {
          const walletRes = await walletService.getWalletInfo();
          if (walletRes.success && walletRes.data) set({ wallet: walletRes.data });
        }
        const transactionsRes = await walletService.getTransactions();
        if (transactionsRes.success && Array.isArray(transactionsRes.data)) {
          set({ transactions: transactionsRes.data });
        }
        return { success: true };
      },

      // ===== SUBSCRIPTION =====
      subscription: emptySubscription,

      toggleAutoRenew: async () => {
        const nextVal = !get().subscription.autoRenew;
        const response = await subscriptionService.toggleAutoRenew(nextVal);
        if (response.success && response.data) {
          set((s) => ({ subscription: { ...s.subscription, autoRenew: response.data.autoRenew } }));
        }
      },

      cancelSubscription: async () => {
        const response = await subscriptionService.cancelSubscription();
        if (response.success) {
          set((s) => ({ subscription: { ...s.subscription, autoRenew: false, status: 'cancelled' } }));
        }
      },

      subscribeToPlan: async (planId) => {
        const response = await subscriptionService.subscribe(planId);
        if (!response.success || !response.data) {
          return { success: false, error: response.message || 'Không thể đăng ký gói VIP' };
        }
        set({ subscription: response.data, isVIPMode: response.data.status === 'active' });
        return { success: true };
      },

      // ===== TRANSACTIONS =====
      transactions: [],

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
              content: response.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.',
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
        if (open) {
          get().syncCheckInStreak();
        }
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

      // ===== DEPOSIT COINS =====
      depositCoins: async (amountVnd, paymentMethod) => {
        const provider = paymentMethod.toUpperCase() === 'MOMO' ? 'MOMO' : 'VNPAY';
        const response = await walletService.deposit({ amountVnd, provider });
        if (!response.success || !response.data) return false;
        if (response.data.balance) set({ wallet: response.data.balance });
        else {
          const walletRes = await walletService.getWalletInfo();
          if (walletRes.success && walletRes.data) set({ wallet: walletRes.data });
        }
        const transactionsRes = await walletService.getTransactions();
        if (transactionsRes.success && Array.isArray(transactionsRes.data)) {
          set({ transactions: transactionsRes.data });
        }
        return true;
      },
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
          checkInStreak: createEmptyCheckInStreak(),
          subscription: emptySubscription,
          transactions: [],
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
